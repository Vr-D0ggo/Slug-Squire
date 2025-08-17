// js/player.js

import { WebProjectile } from './projectiles.js';

export default class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        this.inventory = [];
        this.isEvolved = false;
        this.itemsCollected = 0;
        this.meat = 0;
        this.bossesDefeated = 0;
        this.money = 0;

        // --- NEW: Health & State ---
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.atNest = false; // Is the player currently at a nest?
        this.lastNest = null; // Last visited nest for respawn

        // --- UPDATED: Equipment System ---
        this.equipped = { arms: null, legs: null, weapon: null, wings: null, armor: null, ability: null, trinket: null };
        this.stagedEquipment = { arms: null, legs: null, weapon: null, wings: null, armor: null, ability: null, trinket: null }; // Pending changes
        this.itemSprites = {}; // Lazy-loaded item images

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
        this.baseSpeed = 1.5;
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
        this.walkTime = 0;
        this.hasDoubleJumped = false;
        this.wingFlapTimer = 0;

        // --- Death state ---
        this.isDead = false;
        this.deathTime = 0;

        // --- Attack cooldown ---
        this.attackCooldown = 0;
        this.isRunning = false;
        this.runMultiplier = 2;
        this.slashTimer = 0;
        this.slashDuration = 0;
        this.attackArea = null;
        this.attackFlashTimer = 0;

        // --- Ability system ---
        this.abilityCooldown = 0;
        this.projectiles = [];

        // Direction the player is facing; used for sprite flipping
        this.facingRight = true;
        this.lookDirection = 'forward';

        // Mouse tracking is no longer used for aiming but kept for compatibility
        this.mouse = { x: 0, y: 0 };
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
        if (item.type === 'weapon') {
            this.equipWeapon(item);
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

    equipWeapon(item) {
        if (!(this.equipped.arms || this.stagedEquipment.arms)) {
            console.log('Need arms to equip a weapon.');
            return;
        }
        this.equipped.weapon = item;
        this.stagedEquipment.weapon = null;
        console.log(`Equipped ${item.name}`);
    }

    unequipWeapon() {
        if (this.equipped.weapon) {
            console.log(`Unequipped ${this.equipped.weapon.name}`);
            this.equipped.weapon = null;
        }
    }

    removeEquipment(type) {
        if (!this.equipped[type]) return;
        if (type === 'arms' && this.equipped.weapon) {
            this.unequipWeapon();
        }
        if (type === 'legs') {
            const oldHeight = this.getLegHeight();
            this.equipped.legs = null;
            const newHeight = this.getLegHeight();
            this.y -= (newHeight - oldHeight);
            this.vy = 0;
        } else {
            this.equipped[type] = null;
        }
        console.log(`Removed ${type}.`);
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
        if (this.equipped.wings) total += this.equipped.wings.stats.Weight;
        if (this.equipped.armor) total += this.equipped.armor.stats.Weight;
        if (this.equipped.ability) total += this.equipped.ability.stats.Weight;
        if (this.equipped.trinket) total += this.equipped.trinket.stats.Weight;
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

    collectMeat() {
        this.money++;
        this.meat = this.money;
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
        let armLength = 20;
        if (this.slashTimer > 0 && this.attackArea) {
            armLength = this.lookDirection === 'forward' ? this.attackArea.width : this.attackArea.height;
        }
        const armAngle = Math.sin(currentWalkCycle + Math.PI / 2) * 0.3;

        context.save();
        if (!this.facingRight) {
            context.translate(drawX + this.width, drawY);
            context.scale(-1, 1);
            drawX = 0;
            drawY = 0;
        }
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

        if (this.equipped.wings) {
            context.fillStyle = this.equipped.wings.color || '#999';
            const flap = this.wingFlapTimer > 0 ? Math.sin(this.wingFlapTimer * 0.5) * 10 : 0;
            context.beginPath();
            context.moveTo(drawX - 10, drawY + this.height / 2);
            context.lineTo(drawX - flap, drawY);
            context.lineTo(drawX - flap, drawY + this.height);
            context.fill();
            context.beginPath();
            context.moveTo(drawX + this.width + 10, drawY + this.height / 2);
            context.lineTo(drawX + this.width + flap, drawY);
            context.lineTo(drawX + this.width + flap, drawY + this.height);
            context.fill();
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

        if (this.equipped.armor) {
            context.fillStyle = this.equipped.armor.color || '#888';
            context.fillRect(drawX, drawY + this.height / 3, this.width, this.height / 3);
        }

        if (this.equipped.ability && this.equipped.ability.id === 'spitting_spider_abdomen') {
            const rearX = drawX - 10;
            const rearY = drawY + this.height - 10;
            context.fillStyle = '#000';
            context.beginPath();
            context.arc(rearX, rearY, 10, 0, Math.PI * 2);
            context.fill();
        }

        if (this.equipped.arms) {
            context.fillStyle = '#111';
            context.strokeStyle = '#555';
            const armWidth = 4;
            const attackProgress = this.slashTimer > 0 ? 1 - this.slashTimer / this.slashDuration : null;
            [1, -1].forEach((dir) => {
                context.save();
                const baseX = dir === 1 ? drawX + this.width : drawX;
                const baseY = drawY + this.height * 0.6;
                context.translate(baseX, baseY);
                let angle = dir === 1 ? armAngle : -armAngle;
                if (attackProgress !== null) {
                    if (this.lookDirection === 'up') angle = -Math.PI/2 + attackProgress * Math.PI;
                    else if (this.lookDirection === 'down') angle = Math.PI/2 - attackProgress * Math.PI;
                    else angle = dir === 1 ? attackProgress * Math.PI : -attackProgress * Math.PI;
                }
                context.rotate(angle);
                context.fillRect(dir === 1 ? 0 : -armLength, -armWidth / 2, armLength, armWidth);
                context.beginPath();
                context.moveTo(dir === 1 ? 0 : -armLength, 0);
                context.lineTo(dir === 1 ? armLength : 0, armWidth / 2);
                context.stroke();
                context.restore();
            });
        }

        if (this.equipped.weapon) {
            const weapon = this.equipped.weapon;
            const defaultWidth = weapon.width;
            const defaultHeight = weapon.height;

            let img = null;
            if (weapon.image) {
                img = this.itemSprites[weapon.id];
                if (!img) {
                    img = new Image();
                    img.src = weapon.image;
                    this.itemSprites[weapon.id] = img;
                }
            }
            const drawW = img && img.complete ? img.width : defaultWidth;
            const drawH = img && img.complete ? img.height : defaultHeight;

            if (this.slashTimer > 0) {
                const progress = 1 - this.slashTimer / this.slashDuration;
                context.save();
                let angle = progress * Math.PI;
                if (this.lookDirection === 'up' || this.lookDirection === 'down') {
                    const pivotX = drawX + this.width / 2;
                    const pivotY = drawY + this.height * 0.6;
                    context.translate(pivotX, pivotY);
                    context.rotate(angle);
                    const offsetY = this.lookDirection === 'up' ? -armLength : armLength;
                    context.translate(0, offsetY);
                } else {
                    const handX = drawX + this.width + Math.cos(armAngle) * armLength;
                    const handY = drawY + this.height * 0.6 + Math.sin(armAngle) * armLength;
                    context.translate(handX, handY);
                    context.rotate(angle);
                }
                if (img && img.complete) {
                    context.drawImage(img, 0, -drawH / 2, drawW, drawH);
                } else {
                    context.fillStyle = '#bbb';
                    context.fillRect(0, -drawH / 2, drawW, drawH);
                }
                context.restore();
            } else {
                context.save();
                const backX = drawX + this.width / 2;
                const backY = drawY + this.height / 2;
                context.translate(backX, backY);
                context.rotate(Math.PI / 4);
                if (img && img.complete) {
                    context.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                } else {
                    context.fillStyle = '#bbb';
                    context.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
                }
                context.restore();
            }
        }

        // Player health is now drawn by the main UI rather than above the
        // character sprite. Keeping drawing logic here would result in two
        // health bars, so it has been removed.
        context.restore();
        if (this.attackFlashTimer > 0 && this.attackArea) {
            context.fillStyle = 'rgba(255,0,0,0.5)';
            context.fillRect(this.attackArea.x, this.attackArea.y, this.attackArea.width, this.attackArea.height);
        }
    }

    update(input, roomBoundaries) {
        if (this.isDead) {
            this.deathTime++;
            return;
        }
        if (this.onGround) this.hasDoubleJumped = false;
        if (this.slashTimer > 0) {
            this.slashTimer--;
            this.vx = 0;
        } else {
            const currentSpeed = this.getCurrentSpeed();
            if (input.isActionPressed('right')) {
                this.vx = currentSpeed;
            } else if (input.isActionPressed('left')) {
                this.vx = -currentSpeed;
            } else {
                // Stop instantly when no movement keys are pressed
                this.vx = 0;
            }
            if (Math.abs(this.vx) > 0.1) {
                if (this.onGround) {
                    this.walkTime++;
                    if (this.walkTime >= 120) this.isRunning = true;
                    this.walkCycle += this.isRunning ? 0.5 : 0.25;
                }
            } else {
                this.stopRunning();
            }
            if (this.isRunning) {
                this.vx *= this.runMultiplier;
            }
        }
        this.x += this.vx;

        if (this.vx > 0) this.facingRight = true;
        else if (this.vx < 0) this.facingRight = false;

        if (this.wingFlapTimer > 0) this.wingFlapTimer--;

        if (input.isActionPressed('lookUp')) {
            this.lookDirection = 'up';
        } else if (input.isActionPressed('lookDown')) {
            this.lookDirection = 'down';
        } else {
            this.lookDirection = 'forward';
        }

        const jumpKeysArePressed = input.isActionPressed('jump');
        const jumpPower = this.getCurrentJumpPower();

        if (jumpKeysArePressed && !this.wasJumpPressed && jumpPower !== 0) {
            if (this.onGround) {
                this.vy = jumpPower;
                this.onGround = false;
            } else if (this.equipped.wings && !this.hasDoubleJumped) {
                this.vy = jumpPower;
                this.hasDoubleJumped = true;
                this.wingFlapTimer = 10;
            }
        }
        this.wasJumpPressed = jumpKeysArePressed;

        this.vy += this.baseWeight;
        this.y += this.vy;
        this.onGround = false;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackFlashTimer > 0) this.attackFlashTimer--;
        else this.attackArea = null;

        const leftBoundary = 10;
        const rightBoundary = roomBoundaries.width - this.width - 10;
        if (this.x < leftBoundary) {
            this.x = leftBoundary;
            this.vx = 0;
            this.stopRunning();
        }
        if (this.x > rightBoundary) {
            this.x = rightBoundary;
            this.vx = 0;
            this.stopRunning();
        }

        // Facing is determined by last horizontal movement
    }

    stopRunning() {
        this.isRunning = false;
        this.walkTime = 0;
    }

    applyDamage(amount, type) {
        let modifier = 1;
        const armor = this.equipped.armor;
        if (armor) {
            if (armor.weaknesses && armor.weaknesses[type]) {
                modifier += armor.weaknesses[type];
            }
            if (armor.strengths && armor.strengths[type]) {
                modifier -= armor.strengths[type];
            }
        }
        this.health -= amount * modifier;
    }

    attack(enemies, respawnData, room) {
        if (!this.equipped.weapon || this.attackCooldown > 0) return false;
        let removed = false;
        const weapon = this.equipped.weapon;
        let area;
        const quarterW = this.width / 4;
        const quarterH = this.height / 4;
        const sideWidth = this.width * 2.25;
        const upDownWidth = this.width * 1.5;
        const horizontalOffset = (upDownWidth - this.width) / 2;
        if (this.lookDirection === 'up') {
            area = {
                x: this.x - horizontalOffset,
                y: this.y - quarterH,
                width: upDownWidth,
                height: quarterH
            };
        } else if (this.lookDirection === 'down') {
            area = {
                x: this.x - horizontalOffset,
                y: this.y + this.height,
                width: upDownWidth,
                height: quarterH * 1.15
            };
        } else {
            const attackY = this.y - quarterH;
            const sideHeight = (this.height + quarterH) * 1.15;
            if (this.facingRight) {
                area = { x: this.x + this.width, y: attackY, width: sideWidth, height: sideHeight };
            } else {
                area = { x: this.x - sideWidth, y: attackY, width: sideWidth, height: sideHeight };
            }
        }
        const intersects = (a, b) => {
            return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        };
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (intersects(area, enemy)) {
                let dmg = weapon.damage || 0;
                const type = weapon.damageType || 'slashing';
                if (enemy.weaknesses && enemy.weaknesses[type]) {
                    dmg *= 1 + enemy.weaknesses[type];
                }
                if (enemy.strengths && enemy.strengths[type]) {
                    dmg *= 1 - enemy.strengths[type];
                }
                enemy.health -= dmg;
                if (enemy.health <= 0) {
                    if (respawnData && room) {
                        if (enemy.respawnType === 'never') {
                            if (!respawnData.permanent[room.id]) respawnData.permanent[room.id] = [];
                            respawnData.permanent[room.id].push(enemy.id);
                        } else if (enemy.respawnType === 'bench') {
                            if (!respawnData.bench[room.id]) respawnData.bench[room.id] = [];
                            respawnData.bench[room.id].push(enemy.id);
                        }
                    }
                    enemies.splice(i, 1);
                    removed = true;
                    if (room && room.powerups) {
                        const drops = 1 + Math.floor(Math.random() * 2);
                        for (let d = 0; d < drops; d++) {
                            const size = 20;
                            room.powerups.push({
                                type: 'meat',
                                x: enemy.x + enemy.width / 2 - size / 2 + d * 15,
                                y: enemy.y + enemy.height - size,
                                width: size,
                                height: size,
                                timer: 0
                            });
                        }
                    }
                }
            }
        }
        this.attackCooldown = 30;
        this.slashDuration = this.isRunning ? 20 : 10;
        this.slashTimer = this.slashDuration;
        this.attackArea = area;
        this.attackFlashTimer = 5;
        this.vx = 0;
        this.stopRunning();
        return removed;
    }

    useAbility() {
        if (!this.equipped.ability || this.abilityCooldown > 0) return;
        if (this.equipped.ability.id === 'spitting_spider_abdomen') {
            const rearX = this.facingRight ? this.x : this.x + this.width;
            const rearY = this.y + this.height - 10;
            let dx = 0, dy = 0;
            if (this.lookDirection === 'up') dy = -1;
            else if (this.lookDirection === 'down') dy = 1;
            else dx = this.facingRight ? 1 : -1;
            this.projectiles.push(new WebProjectile(rearX, rearY, dx, dy, this.gameHeight - 20, this.vx, this.vy));
            this.abilityCooldown = 60;
        }
    }

    updateProjectiles(enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update();
            for (const enemy of enemies) {
                if (p.collides(enemy)) {
                    enemy.slowTimer = 120;
                    enemy.slowFactor = 0.5;
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
            if (p.hitGround) this.projectiles.splice(i, 1);
        }
        if (this.abilityCooldown > 0) this.abilityCooldown--;
    }

    drawProjectiles(context) {
        this.projectiles.forEach(p => p.draw(context));
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}
