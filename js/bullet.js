// js/bullet.js (丸ごと上書き)
export class Bullet {
  constructor(x, y, vx, vy, width, height, image, isEnemy = false, isSolar = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isAlive = true;
    
    this.isEnemy = isEnemy;
    this.isSolar = isSolar;   // ★追加：爆符「ペタフレア」用太陽弾フラグ
    this.isGrazed = false; // ★追加：この弾ですでにグレイズしたか
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // ★追加：太陽弾（核熱弾）の場合、移動に伴い徐々に収縮・凝縮する挙動
    if (this.isSolar && this.width > 50) {
      const shrinkAmount = 1.0; // 1フレームあたりの縮小幅
      this.width -= shrinkAmount;
      this.height -= shrinkAmount;
      
      // 縮小時に弾の中心（重心）がズレないように左上座標を補正
      this.x += shrinkAmount / 2;
      this.y += shrinkAmount / 2;
    }
  }

  draw(ctx) {
    if (this.isEnemy) {
      if (this.isSolar) {
        // ★追加：巨大太陽弾（核熱弾）のプロシージャル脈動描画
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = this.width / 2;
        
        ctx.save();
        // 太陽内部の激しい熱対流を表現するため、サイズをサイン波で脈動させる
        const pulse = 1.0 + Math.sin(Date.now() * 0.02) * 0.06;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * pulse);
        grad.addColorStop(0, '#ffffff'); // 超高温の白熱コア
        grad.addColorStop(0.3, '#ffaa00'); // 眩しい黄金フレア
        grad.addColorStop(0.7, '#ff3300'); // 核融合の赤
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)'); // 外周フレアフェード
        
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      } else {
        // ★追加：随伴する青い粒弾の美的な描画（赤オレンジとの対比）
        const radius = this.width / 2;
        ctx.beginPath();
        ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#d0ecff'; // 青白コア
        ctx.fill();
        ctx.strokeStyle = '#0077ff'; // 青枠
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
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
    // 太陽弾は大きいため、画面外判定を少し広めにとる
    const margin = this.isSolar ? this.width : 0;
    return (this.y + this.height + margin < 0 || this.y - margin > canvasHeight || this.x + this.width + margin < 0 || this.x - margin > canvasWidth);
  }
}
