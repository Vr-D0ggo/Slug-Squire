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
                    return new LittleBrownSkink(e.x, e.y);
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
                    // Create a cluster of eggs spread across the nest
                    nest.eggs = [
                        { dx: -50, dy: -3, r: 4, phase: 0 },
                        { dx: -40, dy: 2, r: 3, phase: 1 },
                        { dx: -30, dy: -2, r: 4, phase: 2 },
                        { dx: -20, dy: 0, r: 4, phase: 3 },
                        { dx: -10, dy: -5, r: 5, phase: 4 },
                        { dx: -5, dy: 3, r: 3, phase: 5 },
                        { dx: 5, dy: -6, r: 4, phase: 6 },
                        { dx: 10, dy: 2, r: 3, phase: 7 },
                        { dx: 20, dy: -2, r: 5, phase: 8 },
                        { dx: 30, dy: -4, r: 4, phase: 9 },
                        { dx: 40, dy: 1, r: 3, phase: 10 },
                        { dx: 50, dy: -3, r: 4, phase: 11 }
                    ];
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
            enemy.update(this, player);

            let isColliding = false;

            // Head collision: stop the skink and damage the player continuously
            if (enemy.head &&
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
                player.health -= enemy.damage;
            }

            // Mouth collision when attacking
            if (enemy.mouthOpen && enemy.mouth && !enemy.hasDealtDamage) {
                const m = enemy.mouth;
                if (
                    player.x < m.x + m.width &&
                    player.x + player.width > m.x &&
                    player.y < m.y + m.height &&
                    player.y + player.height > m.y
                ) {
                    isColliding = true;
                    player.health -= enemy.damage;
                    enemy.hasDealtDamage = true;
                }
            }

            // Body collision with proper blocking
            const totalPlayerHeight = player.height + player.getLegHeight();
            const playerBottom = player.y + totalPlayerHeight;
            const playerPrevBottom = player.y - player.vy + totalPlayerHeight;
            const playerPrevRight = player.x - player.vx + player.width;
            const playerPrevLeft = player.x - player.vx;

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
                } else if (player.vx > 0 && playerPrevRight <= enemy.x) {
                    if (!enemy.hasDealtDamage) {
                        player.health -= enemy.damage;
                        enemy.hasDealtDamage = true;
                    }
                    enemy.mouthOpen = true;
                    enemy.mouthTimer = 20;
                    player.x = enemy.x - player.width;
                    player.vx = 0;
                } else if (player.vx < 0 && playerPrevLeft >= enemy.x + enemy.width) {
                    if (!enemy.hasDealtDamage) {
                        player.health -= enemy.damage;
                        enemy.hasDealtDamage = true;
                    }
                    enemy.mouthOpen = true;
                    enemy.mouthTimer = 20;
                    player.x = enemy.x + enemy.width;
                    player.vx = 0;
                }
            }

            if (!isColliding) {
                enemy.hasDealtDamage = false;
            }
        });
    }

    checkCollisions(player) {
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
                this.powerups.splice(i, 1);
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