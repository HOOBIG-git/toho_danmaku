// js/bullet.js (丸ごと上書き)
export class Bullet {
  constructor(x, y, vx, vy, width, height, image, isEnemy = false, isSolar = false, isBucket = false, colorType = 'blue', isBouncing = false, isBubble = false, extra = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.image = image;
    this.isAlive = true;
    
    this.isEnemy = isEnemy;
    this.isSolar = isSolar;     
    this.isBucket = isBucket;   
    this.colorType = colorType; 
    this.isGrazed = false;     
    this.isBouncing = isBouncing; 
    this.isBubble = isBubble;     

    // ★追加：高度な弾道制御用プロパティ
    this.waitTimer = extra.waitTimer || 0;
    this.accel = extra.accel || 0;
    this.maxSpeed = extra.maxSpeed || 20;
    this.isWaitAndGo = extra.isWaitAndGo || false;
    this.targetAngle = extra.targetAngle !== undefined ? extra.targetAngle : null;
    this.timer = 0;
  }

  update() {
    this.timer++;

    // 停止・再始動ロジック
    if (this.waitTimer > 0) {
      this.waitTimer--;
      return; // 待機中は動かない
    }

    // 初回始動時の方向セット
    if (this.isWaitAndGo && this.targetAngle !== null) {
      const speed = Math.hypot(this.vx, this.vy) || 0.1;
      this.vx = Math.cos(this.targetAngle) * speed;
      this.vy = Math.sin(this.targetAngle) * speed;
      this.targetAngle = null; // 一度セットしたらクリア
    }

    // 加速処理
    if (this.accel !== 0) {
      const speed = Math.hypot(this.vx, this.vy);
      if (speed < this.maxSpeed) {
        const ratio = (speed + this.accel) / (speed || 0.001);
        this.vx *= ratio;
        this.vy *= ratio;
      }
    }

    if (this.isBubble) {
      this.y += this.vy; 
      this.x += Math.sin(this.y * 0.05) * 0.8;
    } else {
      this.x += this.vx;
      this.y += this.vy;
    }

    // 壁バウンド処理
    if (this.isBouncing) {
      const playWidth = 360;
      if (this.x < 0) {
        this.x = 0;
        this.vx = -this.vx;
      } else if (this.x + this.width > playWidth) {
        this.x = playWidth - this.width;
        this.vx = -this.vx;
      }
    }

    // 画面下部（Y座標が65%以降）に達すると凝縮する
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
        const wobbleX = (Math.random() - 0.5) * 4.5;
        const wobbleY = (Math.random() - 0.5) * 4.5;
        
        const cx = this.x + this.width / 2 + wobbleX;
        const cy = this.y + this.height / 2 + wobbleY;
        const r = this.width / 2;
        
        ctx.save();
        const pulse = 1.0 + Math.sin(Date.now() * 0.02) * 0.06;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * pulse);
        grad.addColorStop(0, '#ffffff'); 
        grad.addColorStop(0.3, '#ffaa00');
        grad.addColorStop(0.7, '#ff3300');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      } else if (this.isBucket) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const rx = this.width / 2;
        const ry = this.height * 0.72; // Y軸方向を1.4倍近く引き伸ばす（釣瓶落とし再現）
        
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, rx * 0.15, cx, cy, ry);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, '#ffcc44');
        grad.addColorStop(0.8, '#8b4513'); 
        grad.addColorStop(1, 'rgba(139, 69, 19, 0)');
        
        ctx.beginPath();
        // Y方向に引き伸ばし縦型楕円を描く
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // 輪郭に白と少し茶色の二重輪郭で立体感をプラス
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      } else {
        // 通常粒弾の描画（colorTypeによる色調変化）
        const radius = this.width / 2;
        ctx.beginPath();
        ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
        
        if (this.colorType === 'green') {
          // キスメの緑葉・緑雫弾
          ctx.fillStyle = '#e5ffd5'; // 緑白コア
          ctx.fill();
          ctx.strokeStyle = '#1b8633'; // 深緑枠
        } else if (this.colorType === 'red') {
          // 自機狙い等の赤弾
          ctx.fillStyle = '#ffe5e5'; // 赤白コア
          ctx.fill();
          ctx.strokeStyle = '#ff2222'; // 赤枠
        } else {
          // デフォルト: お空の青白らせん弾
          ctx.fillStyle = '#d0ecff'; // 青白コア
          ctx.fill();
          ctx.strokeStyle = '#0077ff'; // 青枠
        }
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
    // 太陽弾やバケツ長弾は大きいため、画面外判定を少し広めにとる
    const margin = (this.isSolar || this.isBucket) ? this.width : 0;
    return (this.y + this.height + margin < 0 || this.y - margin > canvasHeight || this.x + this.width + margin < 0 || this.x - margin > canvasWidth);
  }
}
