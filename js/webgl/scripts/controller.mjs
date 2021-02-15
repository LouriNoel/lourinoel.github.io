export class Controller {
    constructor(canvas) {
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(canvas);
    }
}

class Keyboard {
    constructor() {
        this.mapped = {};

        document.addEventListener("keydown", e => this.handler(e, true), false);
        document.addEventListener("keyup", e => this.handler(e, false), false);
    }

    /**
     * Map a name to a keycode to listen.
     *
     * The same name can be used multiple times.
     * The same keycode can only be used once.
     *
     * As of now, there is no support for keyboard shortcuts.
     *
     * @param {string} name the name of the property to use
     * @param keycode the key to listen
     */
    map(name, keycode) {
        if(!(name in this)){ // if not already mapped
            this[name] = false; // state "up" by default
        }

        this.mapped[keycode] = name;
    }

    /**
     * Called automatically when a key is pressed or released.
     * Use KeyboardEvent.key instead of KeyboardEvent.keyCode if supported.
     * @param {KeyboardEvent} event the event to process
     * @param {boolean} pressed if the key is pressed or released
     */
    handler(event, pressed) {
        let keycode = (event.key !== undefined) ? event.key : event.keyCode;
        if(!event.repeat && keycode in this.mapped){
            this[this.mapped[keycode]] = pressed;
            event.preventDefault(); // prevent the event from being used again.
        }
    }
}

class Mouse {
    constructor(canvas) {
        this.canvas = canvas;

        this.locked = false;
        this.was_locked = false;

        // pointer lock support
        canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;

        canvas.addEventListener("click", this.handleClick.bind(this), false);
    }

    handleClick(event){
        if(this.locked && document.pointerLockElement === null){
            this.lock();
        }
    }

    /**
     * Lock and hide the mouse cursor in the game.
     */
    lock() {
        this.locked = true;
        this.canvas.requestPointerLock();
    }

    /**
     * Free and show the mouse cursor.
     */
    free() {
        this.locked = false;
        document.exitPointerLock();
    }
}
