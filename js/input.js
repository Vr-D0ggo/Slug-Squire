// js/input.js
export default class InputHandler {
    constructor() {
        this.keys = {};
        this.bindings = {
            left: 'a',
            right: 'd',
            jump: 'i',
            inventory: 'e',
            interact: 'o',
            attack: 'u',
            lookUp: 'w',
            lookDown: 's'
        };
        this.awaitingAction = null;
        this.onRebindComplete = null;
        this.loadBindings();

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (this.awaitingAction) {
                this.bindings[this.awaitingAction] = e.key.toLowerCase();
                this.awaitingAction = null;
                if (this.onRebindComplete) this.onRebindComplete();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    isActionPressed(action) {
        const key = this.bindings[action];
        return this.keys[key];
    }

    startRebind(action) {
        this.awaitingAction = action;
    }

    saveBindings() {
        localStorage.setItem('keyBindings', JSON.stringify(this.bindings));
    }

    loadBindings() {
        const stored = localStorage.getItem('keyBindings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                for (const action in this.bindings) {
                    if (parsed[action]) this.bindings[action] = parsed[action];
                }
            } catch (e) {
                console.error('Failed to load key bindings', e);
            }
        }
    }

    resetBindings() {
        this.bindings = {
            left: 'a',
            right: 'd',
            jump: 'i',
            inventory: 'e',
            interact: 'o',
            attack: 'u',
            lookUp: 'w',
            lookDown: 's'
        };
        if (this.onRebindComplete) this.onRebindComplete();
    }
}
