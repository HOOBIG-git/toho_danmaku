// js/boss.js

import { Bullet } from './bullet.js'; //

export class Boss {
  constructor(x, y, width, height, hp, image, canvasWidth) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.maxHp = hp;
    this.hp = hp;
    this.image = image;
    
    this.isAlive = true;
    
    // ボスの移動用パラメータ
    this.canvasWidth = canvasWidth;
    this.targetY = 100; // ボスが定位置とする高さ
    this.speed = 3;     // 移動速度
    this.moveTimer = 0; // 次の移動先を決めるまでのタイマー
    this.targetX = x;   // 次の移動先X座標
    this.lastFired = 0;
    this.fireInterval = 1000; // 1秒(1000ms)ごとに撃つ
  }

  update() {
    if (!this.isAlive) return;

    // 1. まず定位置（targetY）まで降りてくる
    if (this.y < this.targetY) {
      this.y += this.speed;
      return; // 定位置に着くまでは左右移動しない
    }

    // 2. 定位置に着いたら、ランダムに左右に移動する
    this.moveTimer--;
    if (this.moveTimer <= 0) {
      // 画面の幅の中で、ランダムなX座標を次の目的地に設定
      this.targetX = Math.random() * (this.canvasWidth - this.width);
      this.moveTimer = 60 + Math.random() * 60; // 1〜2秒ごとに目的地を変える（60fps想定）
    }

    // 目的地（targetX）に向かって滑らかに移動する
    const dx = this.targetX - this.x;
    if (Math.abs(dx) > this.speed) {
      this.x += (dx > 0 ? this.speed : -this.speed);
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;

    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'red'; // ボスは赤色にしておく
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    this.drawHpBar(ctx); // HPバーを描画するメソッドを追加
  }

  // ボスの頭上にHPバーを描画
  drawHpBar(ctx) {
    const barWidth = this.width * 1.5;
    const barHeight = 8;
    const barX = this.x - (barWidth - this.width) / 2;
    const barY = this.y - 15;

    // 背景（黒）
    ctx.fillStyle = 'black';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 残りHP（赤）
    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }

  // ★追加：自機を狙って弾を撃つメソッド
  fire(timestamp, playerX, playerY) {
    const bullets = [];
    
    // ボスが定位置まで降りてきており、かつ前の発射から一定時間経っていれば
    if (this.y >= this.targetY && timestamp - this.lastFired > this.fireInterval) {
      // ボスの中心座標
      const bx = this.x + this.width / 2;
      const by = this.y + this.height / 2;
      
      // 自機への角度（ラジアン）を計算する超重要関数 atan2
      const angle = Math.atan2(playerY - by, playerX - bx);
      
      const speed = 4; // 敵弾のスピード

      // 自機狙いを中心に、少しずつ角度をずらして3発撃つ（3way弾）
      for (let i = -1; i <= 1; i++) {
        const a = angle + (i * 0.3); // 0.3ラジアン（約17度）ずらす
        const vx = Math.cos(a) * speed;
        const vy = Math.sin(a) * speed;
        
        // 幅・高さを20とし、画像はnull、isEnemyをtrueにする
        bullets.push(new Bullet(bx - 10, by, vx, vy, 20, 20, null, true));
      }
      this.lastFired = timestamp;
    }
    return bullets;
  }
}
