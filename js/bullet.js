// js/bullet.js
export class Bullet {
  constructor(x, y, vx, vy, width, height, image) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isAlive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  // 画面外に出たかどうかの判定
  isOutOfBounds(canvasWidth, canvasHeight) {
    return (this.y + this.height < 0 || this.y > canvasHeight || this.x + this.width < 0 || this.x > canvasWidth);
  }
}