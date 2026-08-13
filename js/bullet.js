// js/bullet.js (丸ごと上書き)
export class Bullet {
  // ★ isEnemy（敵の弾かどうか）を追加
  constructor(x, y, vx, vy, width, height, image, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isAlive = true;
    
    this.isEnemy = isEnemy;
    this.isGrazed = false; // ★追加：この弾ですでにグレイズしたか
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    if (this.isEnemy) {
      // 敵の弾は見やすいように赤い円で描画
      const radius = this.width / 2;
      ctx.beginPath();
      ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaaaa'; // 薄い赤
      ctx.fill();
      ctx.strokeStyle = 'red';   // 赤枠
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // 自機の弾
      if (this.image && this.image.complete) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  }

  isOutOfBounds(canvasWidth, canvasHeight) {
    return (this.y + this.height < 0 || this.y > canvasHeight || this.x + this.width < 0 || this.x > canvasWidth);
  }
}
