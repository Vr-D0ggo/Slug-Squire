// js/player.js

export default class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        this.inventory = [];
        this.isEvolved = false; 

        // --- NEW: Health & State ---
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.atNest = false; // Is the player currently at a nest?

        // --- UPDATED: Equipment System ---
        this.equipped = { arms: null, legs: null };
        this.stagedEquipment = { arms: null, legs: null }; // Pending changes

        this.baseWidth = 40; this.baseHeight = 20;
        this.evolvedWidth = 25; this.evolvedHeight = 50;
        this.baseSpeed = 3;
        this.baseJumpPower = 0;
        this.baseWeight = 0.8;
        const jumpHeight = this.evolvedHeight / 2;
        this.jumpVelocityUnit = -Math.sqrt(2 * this.baseWeight * jumpHeight);
        
        this.width = this.baseWidth; this.height = this.baseHeight;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.friction = 0.9;
        this.wasJumpPressed = false;
        this.walkCycle = 0;
    }

    getLegHeight() {
        return this.equipped.legs ? 10 : 0;
    }

    evolve() {
        if (this.isEvolved) return;
        this.isEvolved = true;
        this.width = this.evolvedWidth;
        this.height = this.evolvedHeight;
        this.y -= (this.evolvedHeight - this.baseHeight); 
    }

    /**
     * Moves a selected item into the staging area, ready for shedding.
     */
    stageItem(item) {
        if (item.type in this.stagedEquipment) {
            this.stagedEquipment[item.type] = item;
            console.log(`Staged ${item.name}`);
        }
    }

    /**
     * Removes an item from the staging area.
     */
    unstageItem(itemType) {
        if (itemType in this.stagedEquipment) {
            this.stagedEquipment[itemType] = null;
            console.log(`Unstaged ${itemType}.`);
        }
    }

    /**
     * Applies all staged equipment changes to the player's equipped gear.
     * This can only be done at a nest.
     */
    shedExoskeleton() {
        if (!this.atNest) {
            console.log("Can only shed exoskeleton at a nest.");
            return;
        }
        // Use Object.assign to copy properties from staged to equipped
        Object.assign(this.equipped, this.stagedEquipment);
        console.log("Exoskeleton shed. Equipment updated.");
    }
    
    getCurrentSpeed() {
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.Speed : 0;
        return this.baseSpeed + gearBonus;
    }

    getCurrentJumpPower() {
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.Jump * this.jumpVelocityUnit : 0;
        return this.baseJumpPower + gearBonus;
    }

    collectItem(item) {
        if (!this.inventory.find(i => i.id === item.id)) {
            this.inventory.push(item);
        }
    }

    draw(context, overrideX, overrideY, isStatic = false) {
        const drawX = overrideX !== undefined ? overrideX : this.x;
        const drawY = overrideY !== undefined ? overrideY : this.y;
        const currentWalkCycle = isStatic ? 0 : this.walkCycle;
        const legHeight = this.getLegHeight();

        if (this.equipped.legs) {
            context.fillStyle = '#111';
            const legWidth = 4;
            const angle = Math.sin(currentWalkCycle) * 0.4;
            context.save();
            context.translate(drawX + this.width * 0.75, drawY + this.height);
            context.rotate(angle);
            context.fillRect(-legWidth / 2, 0, legWidth, legHeight);
            context.restore();
            context.save();
            context.translate(drawX + this.width * 0.25, drawY + this.height);
            context.rotate(-angle);
            context.fillRect(-legWidth / 2, 0, legWidth, legHeight);
            context.restore();
        }

        context.fillStyle = '#d35400';
        context.fillRect(drawX, drawY, this.width, this.height);
        if (this.isEvolved) {
            context.fillStyle = '#2ecc71';
            context.fillRect(drawX, drawY, this.width, 7);
        }

        if (this.equipped.arms) {
            context.fillStyle = '#111';
            const armWidth = 4;
            const armLength = 20;
            const angle = Math.sin(currentWalkCycle + Math.PI / 2) * 0.3;
            context.save();
            context.translate(drawX + this.width, drawY + this.height * 0.6);
            context.rotate(angle);
            context.fillRect(0, -armWidth / 2, armLength, armWidth);
            context.restore();
            context.save();
            context.translate(drawX, drawY + this.height * 0.6);
            context.rotate(-angle);
            context.fillRect(-armLength, -armWidth / 2, armLength, armWidth);
            context.restore();
        }
    }

    update(input, roomBoundaries) {
        const currentSpeed = this.getCurrentSpeed();
        if (input.keys['d'] || input.keys['ArrowRight']) {
            this.vx = currentSpeed;
        } else if (input.keys['a'] || input.keys['ArrowLeft']) {
            this.vx = -currentSpeed;
        } else {
            this.vx *= this.friction;
        }
        this.x += this.vx;

        if (Math.abs(this.vx) > 0.1 && this.onGround) {
            this.walkCycle += 0.25;
        }

        const jumpKeysArePressed = input.keys['w'] || input.keys[' '] || input.keys['ArrowUp'];
        const jumpPower = this.getCurrentJumpPower();

        if (jumpKeysArePressed && !this.wasJumpPressed && this.onGround && jumpPower !== 0) {
            this.vy = jumpPower;
            this.onGround = false;
        }
        this.wasJumpPressed = jumpKeysArePressed;

        this.vy += this.baseWeight;
        this.y += this.vy;
        this.onGround = false;

        const leftBoundary = 10;
        const rightBoundary = roomBoundaries.width - this.width - 10;
        if (this.x < leftBoundary) this.x = leftBoundary;
        if (this.x > rightBoundary) this.x = rightBoundary;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}