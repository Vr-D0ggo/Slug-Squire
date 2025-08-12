export class WebProjectile {
    constructor(x, y, dx, dy) {
        const speed = 5;
        this.x = x;
        this.y = y;
        this.vx = dx * speed;
        this.vy = dy * speed;
        this.radius = 5;
        this.life = 60; // frames
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 0.2, this.y - this.vy * 0.2);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }

    collides(enemy) {
        return (
            this.x > enemy.x &&
            this.x < enemy.x + enemy.width &&
            this.y > enemy.y &&
            this.y < enemy.y + enemy.height
        );
    }
}
