// js/enemy.js
export class Enemy {
  constructor(x, y, width, height, hp, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.maxHp = hp;     // 最大HP
    this.hp = hp;        // 現在のHP
    this.image = image;
    
    this.isAlive = true; // 生きているかどうかのフラグ
    this.speedY = 2;     // 下に降りてくる基本速度
  }

  // 毎フレーム呼ばれる更新処理
  update() {
    if (!this.isAlive) return;
    
    // とりあえず下にゆっくり移動させる（後で複雑な動きに改造できます）
    this.y += this.speedY;
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

  // ダメージを受ける処理
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false; // HPが0以下になったら死亡
    }
  }

  // 画面外（下側）に完全に出たかどうかの判定
  isOutOfBounds(canvasHeight) {
    return (this.y > canvasHeight);
  }
}