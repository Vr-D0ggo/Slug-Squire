// js/player.js

export default class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // --- State and Inventory ---
        this.inventory = [];
        this.isEvolved = false; // Player starts as a basic slug and cannot equip gear

        // --- Equipment Slots ---
        this.equipped = {
            arms: null,
            legs: null,
            // Future slots can be added here (e.g., shell: null)
        };
        
        // --- Shape Properties ---
        this.baseWidth = 40; 
        this.baseHeight = 20;
        this.evolvedWidth = 25; 
        this.evolvedHeight = 50; // Becomes taller after evolving

        // --- Base Stats (unequipped slug) ---
        this.baseSpeed = 3;
        this.baseJumpPower = 0; // Cannot jump by default
        this.baseWeight = 0.8; // Represents gravity's pull

        // --- Physics-based jump calculation ---
        // We calculate the required initial velocity to reach a specific height.
        // The formula for this is: v = -sqrt(2 * g * h) where g=gravity, h=height.
        // We want a 'Jump' stat of 1 to equal a height of half the evolved slug's body.
        const jumpHeight = this.evolvedHeight / 2; // Target jump height (25 pixels)
        this.jumpVelocityUnit = -Math.sqrt(2 * this.baseWeight * jumpHeight);
        // This will calculate a value around -8.9, which is the initial velocity needed.
        // This replaces the old hardcoded "magic number" of -18.

        // --- Dynamic Properties ---
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.x = 0;
        this.y = 0;
        this.vx = 0; // Horizontal velocity
        this.vy = 0; // Vertical velocity
        this.onGround = false;
        this.friction = 0.9; // Slows the player down when not moving
    }

    /**
     * The 'green puddle' power-up triggers this. It allows the slug to use gear and read signs.
     */
    evolve() {
        if (this.isEvolved) return; // Prevent this from running more than once

        this.isEvolved = true;
        this.width = this.evolvedWidth;
        this.height = this.evolvedHeight;
        // Adjust y-position so the now-taller player doesn't clip into the floor
        this.y -= (this.evolvedHeight - this.baseHeight); 

        console.log("Slug has evolved! Can now equip gear and read signs.");
    }

    /**
     * Equips an item from the inventory into its corresponding slot.
     * @param {object} item The item object to equip.
     */
    equipItem(item) {
        if (!this.isEvolved) {
            // This is a safeguard, but the UI should prevent this from being called.
            console.log("Cannot equip items until evolved.");
            return;
        }
        // If an item of the same type is already equipped, it will be replaced.
        if (item.type in this.equipped) {
            this.equipped[item.type] = item;
            console.log(`Equipped ${item.name}`);
        }
    }

    /**
     * Removes an item from an equipment slot.
     * @param {string} itemType The type of slot to clear (e.g., 'legs', 'arms').
     */
    unequipItem(itemType) {
        if (itemType in this.equipped && this.equipped[itemType]) {
            console.log(`Unequipped ${this.equipped[itemType].name}`);
            this.equipped[itemType] = null;
        }
    }

    // --- STAT GETTERS ---
    // These methods calculate the player's current abilities based on equipped gear.

    getCurrentSpeed() {
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.Speed : 0;
        return this.baseSpeed + gearBonus;
    }

    getCurrentJumpPower() {
        // The final jump power is the item's Jump stat multiplied by our calculated velocity unit.
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.Jump * this.jumpVelocityUnit : 0;
        return this.baseJumpPower + gearBonus;
    }

    /**
     * Adds a new item to the player's inventory list.
     * @param {object} item The item object collected from the world.
     */
    collectItem(item) {
        // Ensure the item is not already in the inventory before adding.
        if (!this.inventory.find(i => i.id === item.id)) {
            this.inventory.push(item);
            console.log(`Collected: ${item.name}`);
        }
    }

    /**
     * Draws the player character on the canvas.
     * @param {CanvasRenderingContext2D} context The context to draw on.
     */
    draw(context) {
        // Draw the main slug body
        context.fillStyle = '#d35400';
        context.fillRect(this.x, this.y, this.width, this.height);

        // If evolved, draw the green stripe on top
        if (this.isEvolved) {
            context.fillStyle = '#2ecc71';
            context.fillRect(this.x, this.y, this.width, 7); // A 7px thick stripe
        }
    }

    /**
     * Updates the player's position and state each frame.
     * @param {InputHandler} input The input handler object.
     * @param {object} roomBoundaries The width and height of the current room.
     */
    update(input, roomBoundaries) {
        // Horizontal Movement uses calculated speed
        const currentSpeed = this.getCurrentSpeed();
        if (input.keys['d'] || input.keys['ArrowRight']) {
            this.vx = currentSpeed;
        } else if (input.keys['a'] || input.keys['ArrowLeft']) {
            this.vx = -currentSpeed;
        } else {
            this.vx *= this.friction; // Apply friction if no movement keys are pressed
        }
        this.x += this.vx;

        // --- Boundary checks to keep the player within the room ---
        const leftBoundary = 10;
        const rightBoundary = roomBoundaries.width - this.width - 10;
        if (this.x < leftBoundary) {
            this.x = leftBoundary;
            this.vx = 0;
        }
        if (this.x > rightBoundary) {
            this.x = rightBoundary;
            this.vx = 0;
        }

        // --- Vertical Movement (Gravity & Jump) ---
        // Get the current jump power based on equipped gear.
        const jumpPower = this.getCurrentJumpPower();
        // The jump action is only possible if the calculated jump power is not zero.
        if ((input.keys['w'] || input.keys[' '] || input.keys['ArrowUp']) && this.onGround && jumpPower !== 0) {
            this.vy = jumpPower;
            this.onGround = false;
        }
        // Apply gravity constantly
        this.vy += this.baseWeight;
        this.y += this.vy;
        
        // Assume player is in the air until a collision proves otherwise
        this.onGround = false;
    }

    /**
     * Instantly sets the player's position, used when loading a new room.
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}