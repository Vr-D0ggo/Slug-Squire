// js/camera.js

export default class Camera {
    constructor(gameWidth, gameHeight, worldWidth) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.worldWidth = worldWidth;
        this.x = 0;
        this.y = 0;
    }

    update(player) {
        // Center the camera on the player's x position
        this.x = player.x - this.gameWidth / 2;

        // Keep camera within world bounds (horizontal)
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.gameWidth));
        
        // Optional: Add vertical camera bounds/follow if needed later

    }
}