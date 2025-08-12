// js/room.js
import { LittleBrownSkink } from './enemy.js';

export default class Room {
    constructor(roomData) {
        this.id = roomData.id;
        this.name = roomData.name || "Unnamed Room";
        this.width = roomData.width;
        this.height = roomData.height;
        this.backgroundColor = roomData.backgroundColor;
        this.playerStart = roomData.playerStart;
        this.platforms = roomData.platforms || [];
        this.walls = roomData.walls || [];
        this.powerups = roomData.powerups || [];
        this.interactables = roomData.interactables || [];
        this.nests = roomData.nests || [];
        this.enemies = (roomData.enemies || []).map(e => {
            switch (e.type) {
                case 'little_brown_skink':
                    return new LittleBrownSkink(e.x, e.y, e.id, e.respawnType);
                default:
                    return null;
            }
        }).filter(Boolean);
    }

    draw(context) {
        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, this.width, this.height);

        this.platforms.forEach(platform => {
            context.fillStyle = platform.color || '#888';
            context.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        this.walls.forEach(wall => {
            context.fillStyle = wall.color || '#f0f';
            context.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        this.powerups.forEach(powerup => {
            context.fillStyle = powerup.color;
            context.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
        });

        this.interactables.forEach(item => {
            context.fillStyle = item.color;
            context.fillRect(item.x, item.y, item.width, item.height);
            if (item.tipColor) {
                context.fillStyle = item.tipColor;
                context.fillRect(item.x + item.width - item.width * 0.2, item.y, item.width * 0.2, item.height);
            }
        });
        
        this.nests.forEach(nest => {
            context.fillStyle = nest.color;
            context.beginPath();
            context.ellipse(
                nest.x + nest.width / 2,
                nest.y + nest.height,
                nest.width / 2,
                nest.height,
                0,
                Math.PI,
                2 * Math.PI,
                false
            );
            context.fill();

            if (nest.hasEggs) {
                if (!nest.eggs) {
                    // Fill the nest with enough eggs to cover the mound
                    nest.eggs = [];
                    const cols = 12;
                    const rows = 4;
                    let phase = 0;
                    for (let i = 0; i < cols; i++) {
                        for (let j = 0; j < rows; j++) {
                            const dx = -nest.width / 2 + (i + 0.5) * (nest.width / cols);
                            const dy = -nest.height + (j + 0.5) * (nest.height / rows);
                            const r = 4 + (j % 2);
                            nest.eggs.push({ dx, dy, r, phase: phase++ });
                        }
                    }
                }
                const t = Date.now() / 500;
                context.fillStyle = 'white';
                const centerX = nest.x + nest.width / 2;
                const centerY = nest.y + nest.height - 8;
                nest.eggs.forEach(egg => {
                    const radius = egg.r + Math.sin(t + egg.phase) * 1;
                    context.beginPath();
                    context.arc(centerX + egg.dx, centerY + egg.dy, radius, 0, 2 * Math.PI);
                    context.fill();
                });
            }
        });

        this.enemies.forEach(enemy => {
            enemy.draw(context);
        });
    }

    updateEnemies(player) {
        this.enemies.forEach(enemy => {
            const prevX = enemy.x;
            const prevY = enemy.y;
            enemy.update(this, player);

            if (enemy.interacting && enemy.interactTarget && enemy.interactTarget !== player) {
                enemy.hasDealtDamage = false;
                return;
            }

            if (enemy.sleeping) {
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                    enemy.sleepTimer = 0;
                    enemy.sleeping = false;
                }
            }

            let isColliding = false;

            // Head collision: stop the skink and damage the player continuously
            if (!enemy.sleeping && enemy.head &&
                player.x < enemy.head.x + enemy.head.width &&
                player.x + player.width > enemy.head.x &&
                player.y < enemy.head.y + enemy.head.height &&
                player.y + player.height > enemy.head.y) {
                isColliding = true;
                // Position the skink so its head stays against the player
                if (enemy.direction === 1) {
                    enemy.x = player.x - enemy.headWidth - enemy.width;
                } else {
                    enemy.x = player.x + player.width + enemy.headWidth;
                }
                enemy.vx = 0;
                player.applyDamage(enemy.damage, enemy.damageType);
                if (player.stopRunning) player.stopRunning();
            }

            // Mouth collision when attacking
            if (!enemy.sleeping && enemy.mouthOpen && enemy.mouth && !enemy.hasDealtDamage) {
                const m = enemy.mouth;
                if (
                    player.x < m.x + m.width &&
                    player.x + player.width > m.x &&
                    player.y < m.y + m.height &&
                    player.y + player.height > m.y
                ) {
                    isColliding = true;
                    player.applyDamage(enemy.damage, enemy.damageType);
                    if (player.stopRunning) player.stopRunning();
                    enemy.hasDealtDamage = true;
                    if (enemy.onDealDamage) enemy.onDealDamage(player);
                }
            }

            // Body collision with proper blocking
            const totalPlayerHeight = player.height + player.getLegHeight();
            const playerBottom = player.y + totalPlayerHeight;
            const playerPrevBottom = player.y - player.vy + totalPlayerHeight;
            const playerPrevRight = player.x - player.vx + player.width;
            const playerPrevLeft = player.x - player.vx;
            const enemyPrevRight = prevX + enemy.width;
            const enemyPrevLeft = prevX;

            if (
                player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                playerBottom > enemy.y
            ) {
                isColliding = true;
                if (player.vy >= 0 && playerPrevBottom <= enemy.y) {
                    player.y = enemy.y - totalPlayerHeight;
                    player.vy = 0;
                    player.onGround = true;
                    if (enemy.stun) enemy.stun(30);
                } else if (player.vy < 0 && player.y >= enemy.y + enemy.height) {
                    player.vy = 0;
                    player.y = enemy.y + enemy.height;
                } else if (!enemy.sleeping && playerPrevRight <= enemyPrevLeft && player.x + player.width > enemy.x) {
                    if (!enemy.hasDealtDamage) {
                        player.applyDamage(enemy.damage, enemy.damageType);
                        if (player.stopRunning) player.stopRunning();
                        enemy.hasDealtDamage = true;
                        if (enemy.onDealDamage) enemy.onDealDamage(player);
                    }
                    enemy.mouthOpen = true;
                    enemy.mouthTimer = 20;
                    if (player.vx > 0) {
                        player.x = enemy.x - player.width;
                        player.vx = 0;
                    } else {
                        enemy.x = player.x + player.width;
                        enemy.vx = 0;
                    }
                } else if (!enemy.sleeping && playerPrevLeft >= enemyPrevRight && player.x < enemy.x + enemy.width) {
                    if (!enemy.hasDealtDamage) {
                        player.applyDamage(enemy.damage, enemy.damageType);
                        if (player.stopRunning) player.stopRunning();
                        enemy.hasDealtDamage = true;
                        if (enemy.onDealDamage) enemy.onDealDamage(player);
                    }
                    enemy.mouthOpen = true;
                    enemy.mouthTimer = 20;
                    if (player.vx < 0) {
                        player.x = enemy.x + enemy.width;
                        player.vx = 0;
                    } else {
                        enemy.x = player.x - enemy.width;
                        enemy.vx = 0;
                    }
                }
            }

            if (!isColliding) {
                enemy.hasDealtDamage = false;
            }
        });

        this.handleSkinkInteractions();
    }

    handleSkinkInteractions() {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const a = this.enemies[i];
                const b = this.enemies[j];
                if (a instanceof LittleBrownSkink && b instanceof LittleBrownSkink) {
                    if (!a.interacting && !b.interacting && !a.sleeping && !b.sleeping &&
                        a.x < b.x + b.width &&
                        a.x + a.width > b.x &&
                        a.y < b.y + b.height &&
                        a.y + a.height > b.y) {
                        const sleeper = Math.random() < 0.5 ? a : b;
                        a.startInteraction(b, sleeper === a);
                        b.startInteraction(a, sleeper === b);
                    }
                }
            }
        }
    }

    checkCollisions(player, respawnData, saveGame) {
        // --- Platform Collisions ---
        this.platforms.forEach(platform => {
            const totalPlayerHeight = player.height + player.getLegHeight();
            const playerBottom = player.y + totalPlayerHeight;
            const playerPrevBottom = player.y - player.vy + totalPlayerHeight;
            const playerPrevRight = player.x - player.vx + player.width;
            const playerPrevLeft = player.x - player.vx;

            if (
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                playerBottom > platform.y
            ) {
                if (player.vy >= 0 && playerPrevBottom <= platform.y) {
                    player.y = platform.y - totalPlayerHeight;
                    player.vy = 0;
                    player.onGround = true;
                } else if (player.vy < 0 && player.y >= platform.y + platform.height) {
                    player.vy = 0;
                    player.y = platform.y + platform.height;
                } else if (player.vx > 0 && playerPrevRight <= platform.x) {
                    player.x = platform.x - player.width;
                    player.vx = 0;
                } else if (player.vx < 0 && playerPrevLeft >= platform.x + platform.width) {
                    player.x = platform.x + platform.width;
                    player.vx = 0;
                }
            }
        });

        // --- Power-up Collisions ---
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (
                player.x < powerup.x + powerup.width &&
                player.x + player.width > powerup.x &&
                player.y < powerup.y + powerup.height &&
                player.y + player.height > powerup.y
            ) {
                if (powerup.type === 'evolution_power') {
                    player.evolve();
                }
                if (respawnData) {
                    if (powerup.respawnType === 'never') {
                        if (!respawnData.permanent[this.id]) respawnData.permanent[this.id] = [];
                        respawnData.permanent[this.id].push(powerup.id);
                    } else if (powerup.respawnType === 'bench') {
                        if (!respawnData.bench[this.id]) respawnData.bench[this.id] = [];
                        respawnData.bench[this.id].push(powerup.id);
                    }
                }
                this.powerups.splice(i, 1);
                if (saveGame) saveGame();
            }
        }

        // --- Wall (Teleporter) Collisions ---
        for (const wall of this.walls) {
            if (
                player.x < wall.x + wall.width &&
                player.x + player.width > wall.x &&
                player.y < wall.y + wall.height &&
                player.y + player.height > wall.y
            ) {
                if (wall.targetRoom !== null) {
                    return wall.targetRoom;
                }
            }
        }
        
        return null;
    }
}