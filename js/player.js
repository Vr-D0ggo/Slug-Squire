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
        // friction is no longer needed as the player stops immediately
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
        const oldLegHeight = this.getLegHeight();
        // Use Object.assign to copy properties from staged to equipped
        Object.assign(this.equipped, this.stagedEquipment);
        const newLegHeight = this.getLegHeight();
        this.y -= (newLegHeight - oldLegHeight);
        this.vy = 0;
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
            context.strokeStyle = '#555';
            const legWidth = 4;
            const angle = Math.sin(currentWalkCycle) * 0.4;
            [0.75, 0.25].forEach((offset, i) => {
                context.save();
                context.translate(drawX + this.width * offset, drawY + this.height);
                context.rotate(i === 0 ? angle : -angle);
                context.fillRect(-legWidth / 2, 0, legWidth, legHeight);
                context.beginPath();
                context.moveTo(-legWidth / 2, legHeight * 0.5);
                context.lineTo(legWidth / 2, legHeight);
                context.stroke();
                context.restore();
            });
        }

        context.fillStyle = '#d35400';
        context.fillRect(drawX, drawY, this.width, this.height);
        if (this.isEvolved) {
            context.fillStyle = '#2ecc71';
            context.fillRect(drawX, drawY, this.width, 7);
        }

        if (this.equipped.arms) {
            context.fillStyle = '#111';
            context.strokeStyle = '#555';
            const armWidth = 4;
            const armLength = 20;
            const angle = Math.sin(currentWalkCycle + Math.PI / 2) * 0.3;
            [1, -1].forEach((dir) => {
                context.save();
                if (dir === 1) {
                    context.translate(drawX + this.width, drawY + this.height * 0.6);
                } else {
                    context.translate(drawX, drawY + this.height * 0.6);
                }
                context.rotate(dir === 1 ? angle : -angle);
                context.fillRect(dir === 1 ? 0 : -armLength, -armWidth / 2, armLength, armWidth);
                context.beginPath();
                context.moveTo(dir === 1 ? 0 : -armLength, 0);
                context.lineTo(dir === 1 ? armLength : 0, armWidth / 2);
                context.stroke();
                context.restore();
            });
        }
    }

    update(input, roomBoundaries) {
        const currentSpeed = this.getCurrentSpeed();
        if (input.isActionPressed('right')) {
            this.vx = currentSpeed;
        } else if (input.isActionPressed('left')) {
            this.vx = -currentSpeed;
        } else {
            // Stop instantly when no movement keys are pressed
            this.vx = 0;
        }
        this.x += this.vx;

        if (Math.abs(this.vx) > 0.1 && this.onGround) {
            this.walkCycle += 0.25;
        }

        const jumpKeysArePressed = input.isActionPressed('jump');
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
