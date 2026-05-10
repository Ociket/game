export class Input {
    constructor() {
        this.keys = {};
        this.onKeyDown = null;
        this.onKeyUp = null;

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (this.onKeyDown) this.onKeyDown(e.key.toLowerCase());
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (this.onKeyUp) this.onKeyUp(e.key.toLowerCase());
        });
    }

    isDown(key) {
        return !!this.keys[key];
    }

    reset() {
        this.keys = {};
    }
}