// js/item.js

export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'POWER' (Pアイテム) or 'POINT' (点アイテム)
    this.width = 16;
    this.height = 16;
    this.isAlive = true;
    this.speedY = 1.8; // ゆっくり落下する基本速度
    this.isHoming = false;
    this.homingSpeed = 0;
  }

  update(player) {
    if (!this.isAlive) return;

    // 自機が回収ライン(Y=200)より上に到達した場合、あるいはすでに吸引中の場合、高速で自機にホーミングする
    if (player.y <= 200 || this.isHoming) {
      this.isHoming = true;
      
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const ix = this.x + this.width / 2;
      const iy = this.y + this.height / 2;
      
      const angle = Math.atan2(py - iy, px - ix);
      this.homingSpeed = Math.min(12, this.homingSpeed + 0.4); // 吸い込まれるにつれて徐々に加速
      
      this.x += Math.cos(angle) * this.homingSpeed;
      this.y += Math.sin(angle) * this.homingSpeed;
    } else {
      // 通常落下
      this.y += this.speedY;
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    // 輝くようなグラデーション
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.2);
    
    if (this.type === 'POWER') {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ff4444'); // 赤
      grad.addColorStop(1, 'rgba(255, 68, 68, 0)');
      
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 中央の「P」文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', cx, cy);
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#4444ff'); // 青
      grad.addColorStop(1, 'rgba(68, 68, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 中央の「点」文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('点', cx, cy);
    }

    ctx.restore();
  }

  isOutOfBounds(canvasHeight) {
    return this.y > canvasHeight;
  }
}
