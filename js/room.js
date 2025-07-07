// js/room.js

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
            context.ellipse(nest.x + nest.width / 2, nest.y + nest.height, nest.width / 2, nest.height, 0, Math.PI, 2 * Math.PI, false);
            context.fill();

            if (nest.hasEggs) {
                context.fillStyle = 'white';
                const eggRadius = 5;
                const centerX = nest.x + nest.width / 2;
                const centerY = nest.y + nest.height - eggRadius - 2;
                context.beginPath();
                context.arc(centerX - 15, centerY, eggRadius, 0, 2 * Math.PI);
                context.fill();
                context.beginPath();
                context.arc(centerX, centerY - 5, eggRadius + 1, 0, 2 * Math.PI);
                context.fill();
                context.beginPath();
                context.arc(centerX + 15, centerY, eggRadius, 0, 2 * Math.PI);
                context.fill();
            }
        });
    }

    checkCollisions(player) {
        // --- Platform Collisions ---
        this.platforms.forEach(platform => {
            const totalPlayerHeight = player.height + player.getLegHeight();
            const playerBottom = player.y + totalPlayerHeight;
            const playerPrevBottom = player.y - player.vy + totalPlayerHeight;

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
                }
                if (player.vy < 0 && player.y > platform.y) {
                    player.vy = 0;
                    player.y = platform.y + platform.height;
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