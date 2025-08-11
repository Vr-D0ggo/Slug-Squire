export class Enemy {
    constructor(x, y, width, height, color, id, respawnType = 'room') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.hasDealtDamage = false;

        this.id = id;
        this.respawnType = respawnType;

        this.health = 10;
        this.strengths = {};
        this.weaknesses = {};
        this.damageType = 'physical';
    }

    update(room) {
        this.vy += 0.8;
        this.x += this.vx;
        this.y += this.vy;
        this.onGround = false;
        room.platforms.forEach(p => {
            if (this.x < p.x + p.width &&
                this.x + this.width > p.x &&
                this.y < p.y + p.height &&
                this.y + this.height > p.y) {
                if (this.vy >= 0 && this.y + this.height - this.vy <= p.y) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        });
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

export class LittleBrownSkink extends Enemy {
    constructor(x, y, id, respawnType = 'room') {
        // Enemy size relative to the unevolved player
        const width = 40 * 2.5;      // Slightly shorter than before
        const height = 20 * 0.5;     // Half the player height

        super(x, y, width, height, '#ff69b4', id, respawnType);
        this.health = 20;
        this.damage = 40;
        this.damageType = 'biting';
        this.weaknesses = { slashing: 0.5, biting: 0.5 };

        this.baseSpeed = 1.5;
        this.speed = this.baseSpeed;
        this.direction = 1; // 1 = right, -1 = left
        this.walkCycle = 0;

        this.mouthOpen = false;
        this.mouthTimer = 0;
        this.stunTimer = 0;

        // Larger head for more cartoonish look
        this.headWidth = height * 1.5;
        this.headHeight = height * 1.3;

        const mouthWidth = this.headWidth * 0.4;
        const mouthHeight = this.headHeight * 0.6;
        this.mouth = { x: 0, y: 0, width: mouthWidth, height: mouthHeight };
        this.aggro = false;
        this.aggroPauseTimer = 0;

        // Interaction / sleep state
        this.interacting = false;
        this.interactTarget = null;
        this.backAwayTimer = 0;
        this.hissCount = 0;
        this.hissTimer = 0;
        this.postHissTimer = 0;
        this.willSleep = false;
        this.sleeping = false;
        this.sleepTimer = 0;

        // Post-hit behavior
        this.afterHitState = null; // 'retreat' or 'charge'
        this.afterHitTimer = 0;
    }

    stun(duration) {
        this.stunTimer = duration;
    }

    startInteraction(other, willSleep = false) {
        if (this.interacting || this.sleeping) return;
        this.interacting = true;
        this.interactTarget = other;
        this.backAwayTimer = 15;
        this.hissCount = 0;
        this.hissTimer = 20;
        this.postHissTimer = 0;
        this.willSleep = willSleep;
        this.mouthOpen = false;
    }

    attack(player) {
        const range = this.width;
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = player.y - this.y;
        if (Math.abs(dx) < range && Math.abs(dy) < this.height * 2) {
            this.mouthOpen = true;
            this.mouthTimer = 20;
            this.hasDealtDamage = false;
        }
    }

    onDealDamage(player) {
        this.afterHitState = 'retreat';
        this.afterHitTimer = 30;
        this.direction = player.x < this.x ? 1 : -1;
    }

    update(room, player) {
        if (this.sleepTimer > 0) {
            this.sleepTimer--;
            if (this.sleepTimer === 0) this.sleeping = false;
            this.vx = 0;
            this.mouthOpen = false;
            super.update(room);
            // No turning or attacking while asleep
            return;
        }

        if (this.interacting) {
            const other = this.interactTarget;
            if (this.backAwayTimer > 0) {
                const dir = this.x < other.x ? -1 : 1;
                this.vx = this.baseSpeed * dir;
                this.backAwayTimer--;
            } else if (this.hissCount < 2) {
                this.vx = 0;
                this.hissTimer--;
                if (this.hissTimer === 10) {
                    this.mouthOpen = true;
                } else if (this.hissTimer <= 0) {
                    this.mouthOpen = false;
                    this.hissCount++;
                    this.hissTimer = this.hissCount < 2 ? 20 : 0;
                    if (this.hissCount >= 2) {
                        this.postHissTimer = 60 + Math.floor(Math.random() * 120);
                    }
                }
            } else if (this.postHissTimer > 0) {
                this.vx = 0;
                this.postHissTimer--;
                if (this.postHissTimer === 0) {
                    const dir = this.x < other.x ? -1 : 1;
                    this.direction = dir;
                    this.interacting = false;
                    this.interactTarget = null;
                    if (this.willSleep) {
                        this.sleeping = true;
                        this.sleepTimer = 480;
                    }
                }
            }
            super.update(room);
            // Bounce off room edges
            if (this.x <= 0 || this.x + this.width >= room.width) {
                this.direction *= -1;
                this.x = Math.max(0, Math.min(this.x, room.width - this.width));
            }
            // Bounce off platforms from the sides
            room.platforms.forEach(p => {
                if (
                    this.x < p.x + p.width &&
                    this.x + this.width > p.x &&
                    this.y < p.y + p.height &&
                    this.y + this.height > p.y
                ) {
                    if (this.vx > 0 && this.x + this.width - this.vx <= p.x) {
                        this.x = p.x - this.width;
                        this.direction = -1;
                    } else if (this.vx < 0 && this.x - this.vx >= p.x + p.width) {
                        this.x = p.x + p.width;
                        this.direction = 1;
                    }
                }
            });
            return;
        }

        if (this.afterHitState) {
            if (this.afterHitState === 'retreat') {
                this.vx = this.baseSpeed * 2 * this.direction;
                this.afterHitTimer--;
                if (this.afterHitTimer <= 0) {
                    this.afterHitState = 'charge';
                    this.afterHitTimer = 30;
                    this.direction = player.x < this.x ? -1 : 1;
                }
            } else if (this.afterHitState === 'charge') {
                this.vx = this.baseSpeed * 2.5 * this.direction;
                this.afterHitTimer--;
                if (this.afterHitTimer <= 0) {
                    this.afterHitState = null;
                }
            }
            this.mouthOpen = false;
            super.update(room);
            const headX = this.direction === 1 ? this.x + this.width : this.x - this.headWidth;
            this.head = { x: headX, y: this.y + this.height * 0.1, width: this.headWidth, height: this.headHeight };
            const headFront = this.direction === 1 ? headX + this.headWidth : headX;
            this.mouth.x = headFront - this.mouth.width / 2;
            this.mouth.y = this.y + this.height * 0.1 + this.headHeight / 2 - this.mouth.height / 2;
            return;
        }

        const bodyLength = this.width + this.headWidth;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const headX = this.direction === 1 ? this.x + this.width : this.x - this.headWidth;
        const headCenterX = headX + this.headWidth / 2;
        const headCenterY = this.y + this.height * 0.1 + this.headHeight / 2;
        const tailCenterX = this.direction === 1 ? this.x : this.x + this.width;
        const tailCenterY = this.y + this.height / 2;
        const distHead = Math.hypot(playerCenterX - headCenterX, playerCenterY - headCenterY);
        const distTail = Math.hypot(playerCenterX - tailCenterX, playerCenterY - tailCenterY);

        if (!this.aggro && (distHead < bodyLength || distTail < bodyLength * 0.25)) {
            this.aggro = true;
            this.aggroPauseTimer = 15;
        } else if (this.aggro && distHead > bodyLength * 2 && distTail > bodyLength) {
            this.aggro = false;
            this.speed = this.baseSpeed;
        }

        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
        } else {
            if (this.aggro) {
                if (this.aggroPauseTimer > 0) {
                    this.aggroPauseTimer--;
                    this.vx = 0;
                } else {
                    this.speed = this.baseSpeed * 1.5;
                    if (playerCenterX < this.x + this.width / 2) {
                        this.direction = -1;
                    } else {
                        this.direction = 1;
                    }
                    this.vx = this.speed * this.direction;
                }
            } else {
                this.speed = this.baseSpeed;
                this.vx = this.speed * this.direction;
            }
        }

        super.update(room);

        if (this.onGround && Math.abs(this.vx) > 0.1) {
            this.walkCycle += 0.2;
        }

        // Bounce off room edges
        if (this.x <= 0 || this.x + this.width >= room.width) {
            this.direction *= -1;
            this.x = Math.max(0, Math.min(this.x, room.width - this.width));
        }

        // Bounce off platforms from the sides
        room.platforms.forEach(p => {
            if (
                this.x < p.x + p.width &&
                this.x + this.width > p.x &&
                this.y < p.y + p.height &&
                this.y + this.height > p.y
            ) {
                if (this.vx > 0 && this.x + this.width - this.vx <= p.x) {
                    this.x = p.x - this.width;
                    this.direction = -1;
                } else if (this.vx < 0 && this.x - this.vx >= p.x + p.width) {
                    this.x = p.x + p.width;
                    this.direction = 1;
                }
            }
        });

        if (this.mouthTimer > 0) {
            this.mouthTimer--;
            if (this.mouthTimer === 0) {
                this.mouthOpen = false;
            }
        } else if (this.aggro) {
            this.attack(player);
        }

        this.head = { x: headX, y: this.y + this.height * 0.1, width: this.headWidth, height: this.headHeight };
        const headFront = this.direction === 1 ? headX + this.headWidth : headX;
        this.mouth.x = headFront - this.mouth.width / 2;
        this.mouth.y = this.y + this.height * 0.1 + this.headHeight / 2 - this.mouth.height / 2;
    }

    draw(ctx) {
        if (this.sleeping) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2);
            const headX = this.direction === 1 ? this.x + this.width : this.x - this.headWidth;
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(headX, this.y + this.height / 2, this.headWidth, this.headHeight);
            return;
        }

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const legLen = this.height * 0.6;
        const legWidth = 4;
        const angle = Math.sin(this.walkCycle) * 0.4 * this.direction;

        // Legs
        ctx.fillStyle = '#7f5539';
        ctx.strokeStyle = '#2c2c2c';
        [0.25, 0.75].forEach(offset => {
            ctx.save();
            ctx.translate(this.x + this.width * offset, this.y + this.height);
            ctx.rotate(angle * (offset === 0.25 ? 1 : -1));
            ctx.fillRect(-legWidth / 2, -legLen, legWidth, legLen);
            ctx.beginPath();
            ctx.moveTo(-legWidth / 2, -legLen * 0.5);
            ctx.lineTo(legWidth / 2, -legLen);
            ctx.stroke();
            ctx.restore();
        });

        // Arms
        const armLen = this.height * 0.6;
        [0.25, 0.75].forEach(offset => {
            ctx.save();
            ctx.translate(this.x + this.width * offset, this.y + this.height * 0.6);
            ctx.rotate(-angle * (offset === 0.25 ? 1 : -1));
            ctx.fillRect(-legWidth / 2, 0, legWidth, armLen);
            ctx.beginPath();
            ctx.moveTo(-legWidth / 2, armLen * 0.5);
            ctx.lineTo(legWidth / 2, armLen);
            ctx.stroke();
            ctx.restore();
        });

        // Head
        const headX = this.direction === 1 ? this.x + this.width : this.x - this.headWidth;
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(headX, this.y + this.height * 0.1, this.headWidth, this.headHeight);

        if (this.mouthOpen) {
            const phase = this.mouthTimer / 10 - 1; // 1 to -1 over timer
            const openRatio = 1 - Math.abs(phase); // 0 -> 1 -> 0
            const currentHeight = this.mouth.height * openRatio;
            const mouthY = this.mouth.y + (this.mouth.height - currentHeight) / 2;
            ctx.fillStyle = '#ff9acb';
            ctx.fillRect(this.mouth.x, mouthY, this.mouth.width, currentHeight);
        }
    }
}
