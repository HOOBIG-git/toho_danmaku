// js/enemy.js
import { Bullet } from './bullet.js';

export class Enemy {
  constructor(x, y, width, height, hp, image) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.maxHp = hp;     // 最大HP
    this.hp = hp;        // 現在のHP
    this.image = image;
    
    this.isAlive = true; // 生きているかどうかのフラグ
    this.speedY = 1.6;   // 下に降りてくる基本速度
    this.speedX = (Math.random() - 0.5) * 1.2; // 少し横方向にも揺らす
    
    this.lastFired = 0;
    this.fireInterval = 1400 + Math.random() * 600; // 自機狙い弾の発射間隔（ランダム性付与）
  }

  // 毎フレーム呼ばれる更新処理
  update() {
    if (!this.isAlive) return;
    
    this.y += this.speedY;
    this.x += this.speedX;
  }

  // 描画処理
  draw(ctx) {
    if (!this.isAlive) return;

    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'blue';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  // 自機狙い弾の発射判定
  fire(timestamp, playerX, playerY) {
    const bullets = [];
    if (!this.isAlive) return bullets;

    if (timestamp - this.lastFired > this.fireInterval) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      
      const angle = Math.atan2(playerY - cy, playerX - cx);
      const speed = 2.4; // 避けやすい中速自機狙い弾
      
      bullets.push(new Bullet(
        cx - 6, 
        cy - 6, 
        Math.cos(angle) * speed, 
        Math.sin(angle) * speed, 
        12, 
        12, 
        null, 
        true, 
        false
      ));
      
      this.lastFired = timestamp;
    }
    return bullets;
  }

  // ダメージを受ける処理
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false; // HPが0以下になったら死亡
    }
  }

  // 画面外（下側・左右）に出たかどうかの判定
  isOutOfBounds(canvasWidth, canvasHeight) {
    return (this.y > canvasHeight || this.x + this.width < 0 || this.x > canvasWidth);
  }
}
