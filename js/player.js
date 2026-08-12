// js/player.js
import { Bullet } from './bullet.js';

export class Player {
  constructor(x, y, image, bulletImage) {
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
  }

  update(input, canvasWidth, canvasHeight) {
    // input(InputManager) から情報をもらって移動
    const speed = input.isSlowMode ? this.slowSpeed : this.normalSpeed;
    this.x += input.moveDirX * speed;
    this.y += input.moveDirY * speed;

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
    
    // 当たり判定の描画
    if (input.isSlowMode) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, this.hitboxRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  }
}