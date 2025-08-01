export class Enemy {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
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
    constructor(x, y) {
        const width = 40 * 3;
        const height = 20 / 2;
        super(x, y - height, width, height, '#ff69b4');
        this.damage = 40;
        this.mouthOpen = false;
        this.mouthTimer = 0;
        this.mouth = { x: 0, y: 0, width: width * 0.3, height: height * 0.8 };
    }

    attack(player) {
        const range = this.width / 2;
        const dx = (player.x + player.width/2) - (this.x + this.width/2);
        if (Math.abs(dx) < range && Math.abs(player.y - this.y) < this.height) {
            this.mouthOpen = true;
            this.mouthTimer = 20;
        }
    }

    update(room, player) {
        super.update(room);
        if (this.mouthTimer > 0) {
            this.mouthTimer--;
            if (this.mouthTimer === 0) {
                this.mouthOpen = false;
            }
        } else {
            this.attack(player);
        }
        this.mouth.x = this.x + this.width;
        this.mouth.y = this.y + this.height/2 - this.mouth.height/2;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = '#ff9acb';
        if (this.mouthOpen) {
            ctx.fillRect(this.mouth.x, this.mouth.y, this.mouth.width, this.mouth.height);
        }
    }
}
