// js/player.js

export default class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        this.inventory = [];
        this.isEvolved = false;
        this.itemsCollected = 0;
        this.bossesDefeated = 0;
        this.money = 0;

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

        // --- Attack cooldown ---
        this.attackCooldown = 0;
        this.isRunning = false;
        this.runMultiplier = 2;
        this.slashTimer = 0;
        this.slashDuration = 0;
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
            this.itemsCollected++;
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

        if (this.equipped.weapon) {
            context.fillStyle = '#bbb';
            const swordWidth = 4;
            const swordHeight = 25;
            if (this.isRunning) {
                context.fillRect(drawX + this.width / 2 - swordWidth / 2, drawY - swordHeight, swordWidth, swordHeight);
            } else if (this.slashTimer > 0) {
                const progress = 1 - this.slashTimer / this.slashDuration;
                context.save();
                context.translate(drawX + this.width, drawY + this.height * 0.5);
                const angle = progress * Math.PI;
                context.rotate(angle);
                context.fillRect(0, -swordWidth / 2, swordHeight, swordWidth);
                context.restore();
            } else {
                context.fillRect(drawX + this.width, drawY + this.height * 0.5 - swordHeight, swordWidth, swordHeight);
            }
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
        if (this.slashTimer > 0) {
            this.slashTimer--;
            this.vx = 0;
        } else {
            this.isRunning = input.isActionPressed('run');
            const currentSpeed = this.getCurrentSpeed();
            const speed = this.isRunning ? currentSpeed * this.runMultiplier : currentSpeed;
            if (input.isActionPressed('right')) {
                this.vx = speed;
            } else if (input.isActionPressed('left')) {
                this.vx = -speed;
            } else {
                // Stop instantly when no movement keys are pressed
                this.vx = 0;
            }
            if (Math.abs(this.vx) > 0.1 && this.onGround) {
                this.walkCycle += this.isRunning ? 0.5 : 0.25;
            }
        }
        this.x += this.vx;

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

        if (this.attackCooldown > 0) this.attackCooldown--;

        const leftBoundary = 10;
        const rightBoundary = roomBoundaries.width - this.width - 10;
        if (this.x < leftBoundary) this.x = leftBoundary;
        if (this.x > rightBoundary) this.x = rightBoundary;
    }

    attack(enemies) {
        if (!this.equipped.weapon || this.attackCooldown > 0) return;
        const range = this.isRunning ? 100 : 60;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = (this.x + this.width / 2) - (enemy.x + enemy.width / 2);
            const dy = (this.y + this.height / 2) - (enemy.y + enemy.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < range) {
                enemies.splice(i, 1);
            }
        }
        this.attackCooldown = 30;
        this.slashDuration = this.isRunning ? 20 : 10;
        this.slashTimer = this.slashDuration;
        this.vx = 0;
        this.isRunning = false;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}
