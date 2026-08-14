// js/player.js
import { Bullet } from './bullet.js';

export class Player {
  constructor(x, y, image, bulletImage) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
    this.normalSpeed = 5;
    this.slowSpeed = 2;
    this.hitboxRadius = 4;
    this.image = image;
    this.bulletImage = bulletImage;
    
    this.lastFired = 0;
    this.fireInterval = 100;
    this.hitboxRadius = 4; // 実際の当たり判定
    
    // ★追加：グレイズ（かすり）の設定
    this.grazeRadius = 25; // グレイズ判定の広さ
    this.graze = 0;        // かすった回数スコア
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.graze = 0;
    this.lastFired = 0;
  }


  update(input, canvasWidth, canvasHeight) {
    // ドラッグ移動量(delta)を取得し、低速モード時は感度を減衰
    const sensitivity = input.isSlowMode ? 0.5 : 1.2;
    this.x += input.deltaX * sensitivity;
    this.y += input.deltaY * sensitivity;

    // 消費したので入力をクリア
    input.deltaX = 0;
    input.deltaY = 0;

    // 画面外制限
    if (this.x < 0) this.x = 0;
    if (this.x > canvasWidth - this.width) this.x = canvasWidth - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y > canvasHeight - this.height) this.y = canvasHeight - this.height;
  }

  fire(timestamp, input) {
    const newBullets = [];
    if (timestamp - this.lastFired > this.fireInterval) {
      const bX = this.x + (this.width / 2) - 8; // 弾の幅の半分
      const bY = this.y - 10;
      const bSpd = 15;

      if (input.isSlowMode) {
        newBullets.push(new Bullet(bX - 8, bY, 0, -bSpd, 16, 32, this.bulletImage));
        newBullets.push(new Bullet(bX + 8, bY, 0, -bSpd, 16, 32, this.bulletImage));
      } else {
        newBullets.push(new Bullet(bX, bY, 0, -bSpd, 16, 32, this.bulletImage));
        newBullets.push(new Bullet(bX - 10, bY + 5, -3, -bSpd * 0.95, 16, 32, this.bulletImage));
        newBullets.push(new Bullet(bX + 10, bY + 5, 3, -bSpd * 0.95, 16, 32, this.bulletImage));
      }
      this.lastFired = timestamp;
    }
    return newBullets; // 生成した弾の配列を返す
  }

  draw(ctx, input) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    
    // 当たり判定・グレイズ判定の描画
    if (input.isSlowMode) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      
      // ★追加：グレイズ判定を薄い青色で表示（開発中見やすいように）
      ctx.beginPath();
      ctx.arc(cx, cy, this.grazeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.fill();

      // ヒットボックス（既存の赤い円）
      ctx.beginPath();
      ctx.arc(cx, cy, this.hitboxRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  }
}
