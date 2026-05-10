import { LOCALE_STRINGS } from '../data/config.js';

const SLIDES = [
  { key: 'tutorial_1', icon: '🎮' },
  { key: 'tutorial_2', icon: '💀' },
  { key: 'tutorial_3', icon: '✨' },
  { key: 'tutorial_4', icon: '👹' },
];

export class TutorialScene {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.index = 0;
  }

  init() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position:absolute; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.95); display:flex; flex-direction:column;
      align-items:center; justify-content:center; z-index:200;
      font-family:'Press Start 2P',monospace; color:white;
    `;
    this._renderSlide();
    document.getElementById('gameContainer').appendChild(this.container);
  }

  _renderSlide() {
    const slide = SLIDES[this.index];
    const lang = this._getLang();
    const text = (LOCALE_STRINGS[lang] && LOCALE_STRINGS[lang][slide.key]) || slide.key;
    const isLast = this.index === SLIDES.length - 1;

    this.container.innerHTML = `
      <div style="text-align:center; max-width:400px; padding:20px;">
        <div style="font-size:48px; margin-bottom:20px;">${slide.icon}</div>
        <p style="font-size:14px; line-height:1.6; margin-bottom:30px;">${text}</p>
        <button id="tutorialNextBtn" style="
          padding:12px 28px; background:#f3c26b; border:none;
          font-family:inherit; font-size:14px; cursor:pointer;
          color:#000;
        ">${isLast ? this._t('tutorial_start') : '→'}</button>
        ${this.index > 0 ? '<button id="tutorialSkipBtn" style="margin-top:10px; background:transparent; border:none; font-family:inherit; font-size:10px; color:#aaa; cursor:pointer;">Пропустить</button>' : ''}
      </div>
    `;

    this.container.querySelector('#tutorialNextBtn').addEventListener('click', () => {
      if (isLast) {
        this._finish();
      } else {
        this.index++;
        this._renderSlide();
      }
    });

    const skipBtn = this.container.querySelector('#tutorialSkipBtn');
    if (skipBtn) skipBtn.addEventListener('click', () => this._finish());
  }

  _finish() {
    localStorage.setItem('ps_tutorial_done', '1');
    if (this.container) this.container.remove();
    this.game.switchScene('menu');
  }

  destroy() { if (this.container) this.container.remove(); }
  update() {}
  draw(ctx) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
  }

  _getLang() {
    const s = JSON.parse(localStorage.getItem('pixelSurvivors_settings') || '{}');
    return s.language || 'ru';
  }

  _t(key) {
    const lang = this._getLang();
    return (LOCALE_STRINGS[lang] && LOCALE_STRINGS[lang][key]) || key;
  }
}