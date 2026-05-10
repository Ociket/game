// js/engine/AudioManager.js
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.sounds = {};      // SFX
        this.music = {};       // Фоновая музыка
        this.muted = false;
        this.volumes = { music: 0.5, sfx: 0.7, ui: 0.8 };
        this._isUnlocked = false;
        this._currentMusic = null;
        this._setupVisibility();
    }

    async init() {
        window.AudioManager = this; // Глобальный доступ
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') await this._unlockAudio();
            this._loadSFX();
            this._loadMusic();
        } catch (e) {
            console.warn('[Audio] WebAudio недоступен:', e);
        }
    }

    async _unlockAudio() {
        if (this._isUnlocked || !this.ctx) return;
        const unlock = async () => {
            if (this.ctx?.state === 'suspended') await this.ctx.resume();
            this._isUnlocked = true;
            if (this._currentMusic && !this._currentMusic.paused) {
                this._currentMusic.play().catch(() => {});
            }
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }

    _loadSFX() {
        // Только реально существующие звуки (все в формате .ogg)
        const sfxList = [
            'enemy_die',
            'gameover_jingle',
            'player_hurt',
            'victory_jingle',
            'xp_pickup'
        ];

        for (const name of sfxList) {
            const audio = new Audio(`assets/sounds/${name}.ogg`);
            audio.preload = 'auto';
            audio.volume = this.volumes.sfx;
            audio.onerror = () => {};   // подавляем возможные ошибки
            this.sounds[name] = audio;
        }
    }

    _loadMusic() {
        // Только реально существующие треки
        const musicList = ['menu_theme', 'game_loop', 'boss_fight'];

        for (const name of musicList) {
            const audio = new Audio(`assets/music/${name}.mp3`);
            audio.preload = 'auto';
            audio.volume = this.volumes.music;
            audio.loop = true;
            audio.onerror = () => {};
            this.music[name] = audio;
        }
    }

    // === SFX ===
    playSFX(name) {
        const sfx = this.sounds[name];
        if (sfx && !this.muted) {
            sfx.currentTime = 0;
            sfx.volume = this.volumes.sfx;
            sfx.play().catch(() => {});
        }
    }

    // === MUSIC ===
    playMusic(name, fade = true) {
        if (this.muted) return;
        const track = this.music[name];
        if (!track) return; // Файла нет – молча пропускаем

        if (this._currentMusic === track) return;

        if (this._currentMusic && fade) this._fadeOut(this._currentMusic, 0.5);
        else if (this._currentMusic) this._currentMusic.pause();

        track.volume = 0;
        track.play().catch(() => {});
        if (fade) this._fadeIn(track, 0.5);
        else track.volume = this.volumes.music;
        this._currentMusic = track;
    }

    stopMusic(fade = true) {
        if (!this._currentMusic) return;
        if (fade) this._fadeOut(this._currentMusic, 0.5, () => {
            this._currentMusic.pause();
            this._currentMusic = null;
        });
        else {
            this._currentMusic.pause();
            this._currentMusic = null;
        }
    }

    _fadeIn(audio, duration) {
        let vol = 0;
        const step = this.volumes.music / (duration * 20);
        const interval = setInterval(() => {
            vol += step;
            if (vol >= this.volumes.music) { audio.volume = this.volumes.music; clearInterval(interval); }
            else { audio.volume = vol; }
        }, 50);
    }

    _fadeOut(audio, duration, callback) {
        let vol = audio.volume;
        const step = vol / (duration * 20);
        const interval = setInterval(() => {
            vol -= step;
            if (vol <= 0.05) { audio.volume = 0; audio.pause(); clearInterval(interval); if (callback) callback(); }
            else { audio.volume = vol; }
        }, 50);
    }

    // === ГРОМКОСТЬ ПО КАТЕГОРИЯМ ===
    setVolume(category, value) {
        if (!this.volumes.hasOwnProperty(category)) return;
        this.volumes[category] = Math.max(0, Math.min(1, value));
        if (category === 'sfx') Object.values(this.sounds).forEach(s => s.volume = this.volumes.sfx);
        else if (category === 'music' && this._currentMusic) this._currentMusic.volume = this.volumes.music;
    }

    // === MUTING ===
    mute() {
        this.muted = true;
        if (this.ctx?.state === 'running') this.ctx.suspend();
        if (this._currentMusic && !this._currentMusic.paused) this._currentMusic.pause();
    }

    unmute() {
        this.muted = false;
        if (this.ctx?.state === 'suspended') this.ctx.resume();
        if (this._currentMusic) this._currentMusic.play().catch(() => {});
    }

    _setupVisibility() {
        document.addEventListener('visibilitychange', () => document.hidden ? this.mute() : this.unmute());
        window.addEventListener('blur', () => this.mute());
        window.addEventListener('focus', () => { if (document.hasFocus()) this.unmute(); });
    }
}