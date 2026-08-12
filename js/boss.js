// js/boss.js
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
  }
}