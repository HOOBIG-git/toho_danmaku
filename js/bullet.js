// js/bullet.js (丸ごと上書き)
export class Bullet {
  constructor(x, y, vx, vy, width, height, image, isEnemy = false, isSolar = false, isBucket = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isAlive = true;
    
    this.isEnemy = isEnemy;
    this.isSolar = isSolar;     // ★追加：爆符「ペタフレア」用太陽弾フラグ
    this.isBucket = isBucket;   // ★追加：怪奇「釣瓶落としの怪」用バケツ弾フラグ
    this.isGrazed = false;     // ★追加：この弾ですでにグレイズしたか
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // ★原作再現：太陽弾（核熱弾）は画面下部（Y座標が65%以降）に達すると、急激に収縮・凝縮する（ハッタリ仕様）
    if (this.isSolar) {
      const triggerY = 640 * 0.65; // 画面高の65%付近に引きつけると
      if (this.y >= triggerY && this.width > 45) {
        const shrinkAmount = 4.2; // 急速にシュリンクして隙間を空ける
        this.width -= shrinkAmount;
        this.height -= shrinkAmount;
        
        // 縮小時に中心座標がズレないように補正
        this.x += shrinkAmount / 2;
        this.y += shrinkAmount / 2;
      }
    }
  }

  draw(ctx) {
    if (this.isEnemy) {
      if (this.isSolar) {
        // ★原作再現：不安定な核熱エネルギーを表現するため、中心座標を常に小刻みに振動（wobble）させる
        const wobbleX = (Math.random() - 0.5) * 4.5;
        const wobbleY = (Math.random() - 0.5) * 4.5;
        
        const cx = this.x + this.width / 2 + wobbleX;
        const cy = this.y + this.height / 2 + wobbleY;
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
      } else if (this.isBucket) {
        // ★追加：キスメの釣瓶バケツ弾（エメラルドグリーンの発光エフェクト）
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = this.width / 2;
        
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.1);
        grad.addColorStop(0, '#ffffff');      // 白熱コア
        grad.addColorStop(0.35, '#a4f395');   // 淡い緑の輝き
        grad.addColorStop(0.8, '#1b8633');    // 釣瓶の深いエメラルド
        grad.addColorStop(1, 'rgba(27, 134, 51, 0)');
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
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
    // 太陽弾やバケツ弾は大きいため、画面外判定を少し広めにとる
    const margin = (this.isSolar || this.isBucket) ? this.width : 0;
    return (this.y + this.height + margin < 0 || this.y - margin > canvasHeight || this.x + this.width + margin < 0 || this.x - margin > canvasWidth);
  }
}
