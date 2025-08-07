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
        this.lastNest = null; // Last visited nest for respawn

        // --- UPDATED: Equipment System ---
        this.equipped = { arms: null, legs: null, weapon: null };
        this.stagedEquipment = { arms: null, legs: null, weapon: null }; // Pending changes

        // --- NEW: Unevolved slug sprites ---
        this.sprites = {
            unevolved: {
                idle: new Image(),
                move1: new Image(),
                move2: new Image(),
            },
        };
        this.sprites.unevolved.idle.src = 'Slug1.png';
        this.sprites.unevolved.move1.src = 'Slug2.png';
        this.sprites.unevolved.move2.src = 'Slug3.png';

        // Make the unevolved slug sprites larger on screen
        this.baseWidth = 80; this.baseHeight = 40;
        this.evolvedWidth = 25; this.evolvedHeight = 50;
        this.baseSpeed = 3;
        this.baseJumpPower = 0;
        this.baseWeight = 0.8; // Gravity constant
        this.bodyWeightMg = 500; // Weight of the slug in mg
        const jumpHeight = this.evolvedHeight / 2;
        this.jumpVelocityUnit = -Math.sqrt(2 * this.baseWeight * jumpHeight);
        
        this.width = this.baseWidth; this.height = this.baseHeight;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        // friction is no longer needed as the player stops immediately
        this.wasJumpPressed = false;
        this.walkCycle = 0;

        // --- Death state ---
        this.isDead = false;
        this.deathTime = 0;
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
        if (item.type === 'weapon' && !(this.equipped.arms || this.stagedEquipment.arms)) {
            console.log('Need arms to equip a weapon.');
            return;
        }
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

    getTotalWeightMg() {
        let total = this.bodyWeightMg;
        if (this.equipped.arms) total += this.equipped.arms.stats.Weight;
        if (this.equipped.legs) total += this.equipped.legs.stats.Weight;
        if (this.equipped.weapon) total += this.equipped.weapon.stats.Weight;
        return total;
    }

    getCurrentSpeed() {
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.Speed : 0;
        const weightRatio = this.bodyWeightMg / this.getTotalWeightMg();
        return (this.baseSpeed + gearBonus) * weightRatio;
    }

    getCurrentJumpPower() {
        const gearBonus = this.equipped.legs ? this.equipped.legs.stats.JumpPower * this.jumpVelocityUnit : 0;
        const weightRatio = this.bodyWeightMg / this.getTotalWeightMg();
        return (this.baseJumpPower + gearBonus) * weightRatio;
    }

    collectItem(item) {
        if (!this.inventory.find(i => i.id === item.id)) {
        this.inventory.push(item);
        }
    }

    getAttackSpeed() {
        const baseSpeed = this.equipped.arms ? this.equipped.arms.stats.AttackSpeed : 1;
        const weaponWeight = this.equipped.weapon ? this.equipped.weapon.stats.Weight : 0;
        const weightRatio = this.bodyWeightMg / (this.bodyWeightMg + weaponWeight);
        return baseSpeed * weightRatio;
    }

    getAttackDamage() {
        const baseDamage = this.equipped.arms ? this.equipped.arms.stats.AttackPower : 1;
        const sharpness = this.equipped.weapon ? this.equipped.weapon.stats.Sharpness : 1;
        return baseDamage * sharpness;
    }

    die() {
        this.isDead = true;
        this.deathTime = 0;
    }

    draw(context, overrideX, overrideY, isStatic = false) {
        let drawX = overrideX !== undefined ? overrideX : this.x;
        let drawY = overrideY !== undefined ? overrideY : this.y;
        const currentWalkCycle = isStatic ? 0 : this.walkCycle;
        const legHeight = this.getLegHeight();

        context.save();
        if (this.isDead) {
            const angle = Math.min(this.deathTime / 30, 1) * Math.PI / 2;
            context.translate(drawX + this.width / 2, drawY + this.height);
            context.rotate(angle);
            drawX = -this.width / 2;
            drawY = -this.height;
        }

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

        if (!this.isEvolved) {
            let sprite;
            if (Math.abs(this.vx) > 0.1) {
                // Always use the third slug image when moving
                sprite = this.sprites.unevolved.move2;
            } else {
                sprite = this.sprites.unevolved.idle;
            }
            context.drawImage(sprite, drawX, drawY, this.width, this.height);
        } else {
            context.fillStyle = '#d35400';
            context.fillRect(drawX, drawY, this.width, this.height);
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

        // Player health is now drawn by the main UI rather than above the
        // character sprite. Keeping drawing logic here would result in two
        // health bars, so it has been removed.
        context.restore();
    }

    update(input, roomBoundaries) {
        if (this.isDead) {
            this.deathTime++;
            return;
        }
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
