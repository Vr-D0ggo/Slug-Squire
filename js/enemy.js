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

        this.slowTimer = 0;
        this.slowFactor = 1;
    }

    update(room) {
        if (this.slowTimer > 0) this.slowTimer--;
        else this.slowFactor = 1;
        this.vy += 0.8;
        this.x += this.vx * this.slowFactor;
        this.y += this.vy * this.slowFactor;
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
        if (this.slowTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
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
        this.scanRange = 200;
        this.fov = Math.PI / 3; // 60 degree field of view
        this.headDirection = this.direction;
        this.searchTimer = 0;
        this.searchFlipTimer = 0;

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
        this.wakeDelay = 0;

        this.postStunDelay = 0;

        // Post-hit behavior
        this.afterHitState = null; // 'retreat' or 'charge'
        this.afterHitTimer = 0;

        // Meat eating behaviour
        this.targetMeat = null;
        this.eating = false;
        this.eatingTimer = 0;
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

    hasLineOfSight(player, room) {
        const x1 = this.x + this.width / 2;
        const y1 = this.y + this.height / 2;
        const x2 = player.x + player.width / 2;
        const y2 = player.y + player.height / 2;
        const obstacles = [
            ...room.platforms,
            ...room.walls,
            ...room.enemies.filter(e => e !== this)
        ];
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            for (const o of obstacles) {
                if (x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height) {
                    return false;
                }
            }
        }
        return true;
    }

    update(room, player) {
        if (this.eating) {
            this.vx = 0;
            this.mouthOpen = false;
            if (this.eatingTimer > 0) {
                this.eatingTimer--;
                if (this.eatingTimer === 0) {
                    this.eating = false;
                    this.health = Math.min(this.health + 5, 20);
                }
            }
            super.update(room);
            return;
        }

        if (this.targetMeat) {
            const dx = this.targetMeat.x - this.x;
            this.direction = dx > 0 ? 1 : -1;
            this.vx = this.baseSpeed * this.direction;
            if (Math.abs(dx) < 5) {
                this.x = this.targetMeat.x;
                this.targetMeat = null;
                this.eating = true;
                this.eatingTimer = 120;
                this.vx = 0;
            }
            super.update(room);
            return;
        }

        if (this.sleepTimer > 0) {
            this.sleepTimer--;
            if (this.sleepTimer === 0) {
                this.sleeping = false;
                this.wakeDelay = 60;
            }
            this.vx = 0;
            this.mouthOpen = false;
            super.update(room);
            // No turning or attacking while asleep
            return;
        }

        if (this.wakeDelay > 0) this.wakeDelay--;

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
            const headX = this.headDirection === 1 ? this.x + this.width : this.x - this.headWidth;
            this.head = { x: headX, y: this.y + this.height * 0.1, width: this.headWidth, height: this.headHeight };
            const headFront = this.headDirection === 1 ? headX + this.headWidth : headX;
            this.mouth.x = headFront - this.mouth.width / 2;
            this.mouth.y = this.y + this.height * 0.1 + this.headHeight / 2 - this.mouth.height / 2;
            return;
        }

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const headX = this.headDirection === 1 ? this.x + this.width : this.x - this.headWidth;
        const headCenterX = headX + this.headWidth / 2;
        const headCenterY = this.y + this.height * 0.1 + this.headHeight / 2;
        const dx = playerCenterX - headCenterX;
        const dy = playerCenterY - headCenterY;
        const dist = Math.hypot(dx, dy);
        let angleDiff = 0;
        if (dist !== 0) {
            const angleToPlayer = Math.atan2(dy, dx);
            const facingAngle = this.headDirection === 1 ? 0 : Math.PI;
            angleDiff = ((angleToPlayer - facingAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
        }
        const canSee = dist < this.scanRange && Math.abs(angleDiff) <= this.fov / 2 && this.hasLineOfSight(player, room);

        if (!this.aggro && canSee) {
            this.aggro = true;
            this.aggroPauseTimer = 15;
        } else if (this.aggro && !canSee) {
            this.aggro = false;
            this.speed = this.baseSpeed;
            this.searchTimer = 60;
            this.searchFlipTimer = 30;
            this.headDirection = this.direction;
        }

        if (this.searchTimer > 0) {
            this.vx = 0;
            this.searchTimer--;
            this.searchFlipTimer--;
            if (this.searchFlipTimer <= 0) {
                this.headDirection *= -1;
                this.searchFlipTimer = 30;
            }
        } else {
            this.headDirection = this.direction;
        }

        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
            if (this.stunTimer === 0) this.postStunDelay = 60;
        } else if (this.postStunDelay > 0) {
            this.postStunDelay--;
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
        } else if (this.aggro && this.wakeDelay === 0 && this.postStunDelay === 0) {
            this.attack(player);
        }

        this.head = { x: headX, y: this.y + this.height * 0.1, width: this.headWidth, height: this.headHeight };
        const headFront = this.direction === 1 ? headX + this.headWidth : headX;
        this.mouth.x = headFront - this.mouth.width / 2;
        this.mouth.y = this.y + this.height * 0.1 + this.headHeight / 2 - this.mouth.height / 2;
    }

    draw(ctx) {
        const headX = this.headDirection === 1 ? this.x + this.width : this.x - this.headWidth;
        const headCenterX = headX + this.headWidth / 2;
        const headCenterY = this.y + this.height * 0.1 + this.headHeight / 2;
        ctx.fillStyle = 'rgba(255,255,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(headCenterX, headCenterY);
        const startAngle = this.headDirection === 1 ? -this.fov / 2 : Math.PI - this.fov / 2;
        const endAngle = this.headDirection === 1 ? this.fov / 2 : Math.PI + this.fov / 2;
        ctx.arc(headCenterX, headCenterY, this.scanRange, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        if (this.sleeping || this.eating) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2);
            const headXSleep = this.headDirection === 1 ? this.x + this.width : this.x - this.headWidth;
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(headXSleep, this.y + this.height / 2, this.headWidth, this.headHeight);
            if (this.eating) {
                ctx.fillStyle = '#ff9acb';
                ctx.fillRect(headXSleep + this.headWidth * 0.3, this.y + this.height / 2 + this.headHeight * 0.4, this.headWidth * 0.4, this.headHeight * 0.2);
            }
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
        if (this.slowTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
