// js/boss.js

import { Bullet } from './bullet.js'; //

export class Boss {
  constructor(x, y, width, height, hp, image, canvasWidth, spellName = '爆符「ペタフレア」', timeLimit = 60) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.maxHp = hp;
    this.hp = hp;
    this.image = image;
    
    this.isAlive = true;
    
    // スペルカード設定
    this.spellName = spellName;
    this.timeLimit = timeLimit; // 制限時間（秒）
    
    // 魔法陣の回転角度
    this.magicCircleAngle = 0;
    
    // ペタフレア用弾幕タイマーとステート
    this.lastBlueFired = 0;
    this.blueFireInterval = 220; // 青い螺旋弾幕の間隔(ms)
    this.blueSpiralAngle = 0;     // 青い螺旋の回転用角度
    this.lastSolarFired = 0;
    this.solarFireInterval = 1000; // 巨大太陽弾の間隔(ms)
    
    // ボスの移動用パラメータ
    this.canvasWidth = canvasWidth;
    this.targetY = 100; // ボスが定位置とする高さ
    this.speed = 3;     // 移動速度
    this.moveTimer = 0; // 次の移動先を決めるまでのタイマー
    this.targetX = x;   // 次の移動先X座標
  }

  // ボスの状態をリセットする（リトライ用）
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.hp = this.maxHp;
    this.isAlive = true;
    this.moveTimer = 0;
    this.targetX = this.startX;
    
    // ペタフレア用ステートの初期化
    this.lastBlueFired = 0;
    this.blueSpiralAngle = 0;
    this.lastSolarFired = 0;
    
    this.magicCircleAngle = 0;
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

  // ボス背後にゆっくり自動回転する美しい幾何学魔法陣を描画
  drawMagicCircle(ctx) {
    if (!this.isAlive) return;
    
    ctx.save();
    // ボスの中心を回転基準点にする
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.magicCircleAngle);
    
    // 薄ピンク・薄赤の glowing な色合い
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.22)';
    ctx.lineWidth = 1.5;
    
    // 外円と内円の二重環
    const r = 90;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内側の正三角形1
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const x = Math.cos(angle) * (r - 12);
      const y = Math.sin(angle) * (r - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // 内側の正三角形2（逆向き・六角星を形成）
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 + Math.PI;
      const x = Math.cos(angle) * (r - 12);
      const y = Math.sin(angle) * (r - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // 中央のコア円
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // 毎フレーム一定速度で回転
    this.magicCircleAngle += 0.007;
  }

  // ボス周囲を取り囲む円形HPゲージ
  drawCircleHpBar(ctx) {
    if (!this.isAlive) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width * 0.72; // ボスの少し外周

    ctx.save();
    
    // 背景の円軌道（極めて薄い白）
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // HP残量の円弧
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio > 0) {
      ctx.beginPath();
      // 真上（-90度）から時計回りに現在のHP割合分だけ描画
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2) * hpRatio);
      
      // HPが1/4以下になると危険赤、それ以外は美しい半透明ホワイト
      ctx.strokeStyle = hpRatio < 0.25 ? 'rgba(255, 80, 80, 0.75)' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round'; // 角を丸く
      ctx.stroke();
    }
    
    ctx.restore();
  }

  draw(ctx) {
    if (!this.isAlive) return;

    // 1. 背後の回転魔法陣を先に描画
    this.drawMagicCircle(ctx);

    // 2. ボス本体
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'red'; // ボスは赤色にしておく
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // 3. ボス周囲の円形HPバーを描画
    this.drawCircleHpBar(ctx);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
  }

  // 爆符「ペタフレア」専用の弾幕発射メソッド
  fire(timestamp, playerX, playerY) {
    const bullets = [];
    if (this.y < this.targetY) return bullets; // 定位置に降りるまでは発射しない

    const bx = this.x + this.width / 2;
    const by = this.y + this.height / 2;

    // 1. 巨大太陽弾（核熱弾）の発射（1秒おき）
    if (timestamp - this.lastSolarFired > this.solarFireInterval) {
      // 自機への中心角
      const angle = Math.atan2(playerY - by, playerX - bx);
      
      const solarSpeed = 2.0; // 太陽弾は威圧感を出すために比較的ゆっくり進む
      
      // 自機方向への3way
      for (let i = -1; i <= 1; i++) {
        const a = angle + (i * 0.45); // 約25度ずつ左右にずらす
        const vx = Math.cos(a) * solarSpeed;
        const vy = Math.sin(a) * solarSpeed;
        
        // 太陽弾は最初は極めて巨大（140x140）に生成され、進むにつれて徐々に凝縮・縮小する
        bullets.push(new Bullet(bx - 70, by - 70, vx, vy, 140, 140, null, true, true));
      }
      this.lastSolarFired = timestamp;
    }

    // 2. 随伴する青い粒弾（美しい螺旋弾幕）の発射（0.22秒おき）
    if (timestamp - this.lastBlueFired > this.blueFireInterval) {
      const numBlue = 6;     // 1周に6発
      const blueSpeed = 3.6; // 青い弾は少し速めで隙間を埋める
      
      for (let i = 0; i < numBlue; i++) {
        const a = this.blueSpiralAngle + (i * Math.PI * 2) / numBlue;
        const vx = Math.cos(a) * blueSpeed;
        const vy = Math.sin(a) * blueSpeed;
        
        // 青い随伴粒弾 (14x14)
        bullets.push(new Bullet(bx - 7, by - 7, vx, vy, 14, 14, null, true, false));
      }
      
      // 螺旋を自動で回転させるため角度を足す
      this.blueSpiralAngle += 0.08;
      this.lastBlueFired = timestamp;
    }

    return bullets;
  }
}