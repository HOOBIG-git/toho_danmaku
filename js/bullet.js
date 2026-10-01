// js/bullet.js (高度な挙動対応版)
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
    this.behavior = extra.behavior || 'linear'; // 'linear', 'converge', 'expand'
    this.waitTimer = extra.waitTimer || 0;
    this.accel = extra.accel || 0;
    this.maxSpeed = extra.maxSpeed || 20;
    this.isWaitAndGo = extra.isWaitAndGo || false;
    this.targetAngle = extra.targetAngle !== undefined ? extra.targetAngle : null;
    this.splitTimer = extra.splitTimer || null; // 0になると分裂する
    this.targetX = extra.targetX || 0;
    this.targetY = extra.targetY || 0;
    this.timer = 0;
    this.lifeTime = extra.lifeTime || 600; // デフォルトで約10秒 (60fps)
  }

  update() {
    this.timer++;
    this.lifeTime--;

    if (this.lifeTime <= 0) {
      this.isAlive = false;
      return;
    }

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

    // --- 挙動別ロジック ---
    if (this.behavior === 'converge') {
      // 特異点収束：ターゲットに向かって加速する
      const dx = this.targetX - (this.x + this.width / 2);
      const dy = this.targetY - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        this.vx += (dx / dist) * this.accel;
        this.vy += (dy / dist) * this.accel;
      }
    } else if (this.behavior === 'expand') {
      // 爆発的な拡散：外側に向かって加速
      const dx = (this.x + this.width / 2) - this.targetX;
      const dy = (this.y + this.height / 2) - this.targetY;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.vx += (dx / dist) * this.accel;
        this.vy += (dy / dist) * this.accel;
      }
    }

    // 加速処理 (behaviorがlinearでもaccelがあれば適用)
    if (this.accel !== 0 && this.behavior === 'linear') {
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

    // 太陽弾のシュリンク演出
    if (this.isSolar) {
      const triggerY = 640 * 0.65;
      if (this.y >= triggerY && this.width > 45) {
        const shrinkAmount = 4.2;
        this.width -= shrinkAmount;
        this.height -= shrinkAmount;
        this.x += shrinkAmount / 2;
        this.y += shrinkAmount / 2;
      }
    }
  }

  // 分裂判定
  shouldSplit() {
    if (this.splitTimer !== null) {
      this.splitTimer--;
      return this.splitTimer <= 0;
    }
    return false;
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
        const ry = this.height * 0.72;
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, rx * 0.15, cx, cy, ry);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, '#ffcc44');
        grad.addColorStop(0.8, '#8b4513');
        grad.addColorStop(1, 'rgba(139, 69, 19, 0)');
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      } else {
        const radius = this.width / 2;
        ctx.beginPath();
        ctx.arc(this.x + radius, this.y + radius, radius, 0, Math.PI * 2);
        if (this.colorType === 'green') {
          ctx.fillStyle = '#e5ffd5';
          ctx.fill();
          ctx.strokeStyle = '#1b8633';
        } else if (this.colorType === 'red') {
          ctx.fillStyle = '#ffe5e5';
          ctx.fill();
          ctx.strokeStyle = '#ff2222';
        } else {
          ctx.fillStyle = '#d0ecff';
          ctx.fill();
          ctx.strokeStyle = '#0077ff';
        }
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    } else {
      if (this.image && this.image.complete) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  }

  isOutOfBounds(canvasWidth, canvasHeight) {
    const margin = (this.isSolar || this.isBucket) ? this.width : 0;
    return (this.y + this.height + margin < 0 || this.y - margin > canvasHeight || this.x + this.width + margin < 0 || this.x - margin > canvasWidth);
  }
}
