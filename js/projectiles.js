export class WebProjectile {
    constructor(x, y, dx, dy, groundY) {
        const speed = 5;
        this.x = x;
        this.y = y;
        this.vx = dx * speed;
        this.vy = dy * speed;
        this.radius = 10;
        this.groundY = groundY;
        this.hitGround = false;
    }

    update() {
        this.vy += 0.3;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y + this.radius >= this.groundY) {
            this.hitGround = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    collides(enemy) {
        return (
            this.x + this.radius > enemy.x &&
            this.x - this.radius < enemy.x + enemy.width &&
            this.y + this.radius > enemy.y &&
            this.y - this.radius < enemy.y + enemy.height
        );
    }
}
