// js/room.js

export default class Room {
    constructor(roomData) {
        this.id = roomData.id;
        this.name = roomData.name || "Unnamed Room";
        
        // The room's own dimensions, which can be larger than the canvas
        this.width = roomData.width;
        this.height = roomData.height;

        this.backgroundColor = roomData.backgroundColor;
        this.playerStart = roomData.playerStart;
        
        // Initialize all object arrays, defaulting to empty if not provided
        this.platforms = roomData.platforms || [];
        this.walls = roomData.walls || [];
        this.powerups = roomData.powerups || [];
        this.interactables = roomData.interactables || [];
    }

    /**
     * Draws the entire room and all its contents onto the canvas context.
     * This is called from within the camera transform in main.js.
     * @param {CanvasRenderingContext2D} context The canvas context to draw on.
     */
    draw(context) {
        // 1. Draw the background, covering the entire room's area
        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, this.width, this.height);

        // 2. Draw all platforms
        this.platforms.forEach(platform => {
            context.fillStyle = platform.color || '#888';
            context.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // 3. Draw all walls (which can be teleporters or simple barriers)
        this.walls.forEach(wall => {
            context.fillStyle = wall.color || '#f0f'; // Bright magenta for debug
            context.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        // 4. Draw all powerups that haven't been collected yet
        this.powerups.forEach(powerup => {
            context.fillStyle = powerup.color;
            context.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
        });

        // 5. Draw all interactable items that haven't been picked up
        this.interactables.forEach(item => {
            context.fillStyle = item.color;
            context.fillRect(item.x, item.y, item.width, item.height);
        });
    }

    /**
     * Checks for and handles collisions between the player and various room objects.
     * It modifies the player state directly (e.g., for landing on platforms)
     * and removes collected items from the room's arrays.
     * @param {Player} player The player object.
     * @returns {number | null} The ID of the target room if a teleporter wall is hit, otherwise null.
     */
    checkCollisions(player) {
        // --- Platform Collisions ---
        // This handles landing on platforms and bumping head on ceilings.
        this.platforms.forEach(platform => {
            // Basic AABB (Axis-Aligned Bounding Box) collision check
            if (
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y
            ) {
                // Check if landing on top of the platform
                // The `- player.vy` check prevents the player from "snapping" up to a platform they are passing underneath.
                if (player.vy >= 0 && (player.y + player.height - player.vy) <= platform.y + 1) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                }
                // Check if hitting the bottom of a platform (ceiling)
                if (player.vy < 0 && player.y > platform.y) {
                    player.vy = 0;
                    player.y = platform.y + platform.height;
                }
            }
        });

        // --- Power-up Collisions ---
        // Loop backwards so we can safely remove items from the array while iterating.
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (
                player.x < powerup.x + powerup.width &&
                player.x + player.width > powerup.x &&
                player.y < powerup.y + powerup.height &&
                player.y + player.height > powerup.y
            ) {
                // Collision detected! Grant the specific power.
             if (powerup.type === 'evolution_power') {
                    player.evolve();
                }
                // Remove the powerup from the room so it can't be collected again.
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
                // If a wall has a defined targetRoom, return it to trigger a teleport.
                if (wall.targetRoom !== null) {
                    return wall.targetRoom;
                }
            }
        }
        
        // No teleporter wall was hit
        return null;
    }
}