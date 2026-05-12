// js/sdk/YandexSDK.js
export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.lang = 'ru';
    this.isReady = false;
    this.isRewardedPending = false;
  }

  async init() {
    try {
      if (typeof YaGames === 'undefined') {
        console.warn('[SDK] Yandex SDK не найден. Работа в локальном режиме.');
        return;
      }
      this.ysdk = await YaGames.init();
      this.lang = this.ysdk.environment.i18n.lang || 'ru';
      
      try {
        this.player = await this.ysdk.getPlayer({ scopes: false });
      } catch (e) {
        console.warn('[SDK] Нет доступа к данным игрока:', e);
      }
      
      this.isReady = true;
      this._setupYandexListeners();
    } catch (err) {
      console.error('[SDK] Init error:', err);
    }
  }

  _setupYandexListeners() {
    if (!this.ysdk) return;
    this.ysdk.on('game_api_pause', () => {
        if (window.AudioManager) window.AudioManager.mute();
        // Принудительная пауза игры при сворачивании
        if (window.game?.currentScene?.togglePause && !window.game.currentScene.paused) {
            window.game.currentScene.togglePause();
        }
    });
    this.ysdk.on('game_api_resume', () => {
        if (window.AudioManager) window.AudioManager.unmute();
        // НЕ снимаем паузу автоматически — игрок сам нажмёт «Продолжить»
    });
    if (this.ysdk.EVENTS?.HISTORY_BACK) {
        this.ysdk.on(this.ysdk.EVENTS.HISTORY_BACK, () => {
            if (window.game?.currentScene?.togglePause) {
                window.game.currentScene.togglePause();
            }
        });
        }
}

  async showInterstitial() {
    if (!this.isReady || !this.ysdk?.adv) return Promise.resolve();
    return new Promise(res => {
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => { if (window.AudioManager) window.AudioManager.mute(); },
          onClose: (wasShown) => { if (window.AudioManager) window.AudioManager.unmute(); res(wasShown); },
          onError: () => { if (window.AudioManager) window.AudioManager.unmute(); res(false); }
        }
      });
    });
  }

  async showRewarded() {
    if (!this.isReady || !this.ysdk?.adv) return Promise.resolve(false);
    if (this.isRewardedPending) return false;
    
    this.isRewardedPending = true;
    return new Promise(res => {
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => { if (window.AudioManager) window.AudioManager.mute(); },
          onRewarded: () => { res(true); },
          onClose: () => { 
            this.isRewardedPending = false;
            if (window.AudioManager) window.AudioManager.unmute();
            res(false);
          },
          onError: () => {
            this.isRewardedPending = false;
            if (window.AudioManager) window.AudioManager.unmute();
            res(false);
          }
        }
      });
    });
  }

  async saveCloud(data) {
    if (!this.isReady || !this.player) return false;
    try {
      await this.player.setData(data);
      return true;
    } catch (e) {
      console.warn('[Cloud] Save failed:', e);
      return false;
    }
  }

  async loadCloud() {
    if (!this.isReady || !this.player) return null;
    try {
      // Забираем все ключи без фильтра, чтобы timestamp и diffUnlocks дошли до metaProgress.js
      const data = await this.player.getData();
      return data || null;
    } catch (e) {
      console.warn('[Cloud] Load failed:', e);
      return null;
    }
  }
  // js/sdk/YandexSDK.js — добавить внутрь класса

/**
 * Установить счёт в лидерборде.
 * @param {string} leaderboardName — имя лидерборда, например 'kills'
 * @param {number} score — очки
 */
setLeaderboardScore(leaderboardName, score) {
    if (!this.isReady || !this.ysdk) return;
    try {
        this.ysdk.getLeaderboards()
            .then(lb => lb.setLeaderboardScore(leaderboardName, score))
            .catch(e => console.warn('Leaderboard update failed:', e));
    } catch (e) {
        console.warn('Leaderboard update failed:', e);
    }
}

/**
 * Разблокировать достижение по его ID.
 * @param {string} achievementId — id из ACHIEVEMENTS_LIST
 */
unlockAchievement(achievementId) {
    if (!this.isReady || !this.ysdk) return;
    this.ysdk.getAchievements()
        .then(ach => ach.unlock(achievementId))
        .catch(e => console.warn('Achievement unlock failed:', e));
}
// js/sdk/YandexSDK.js — добавить внутрь класса

toggleFullscreen() {
    if (!this.isReady || !this.ysdk?.screen?.fullscreen) return;
    if (this.ysdk.screen.fullscreen.status === 'on') {
        this.ysdk.screen.fullscreen.exit();
    } else {
        this.ysdk.screen.fullscreen.request();
    }
}
}