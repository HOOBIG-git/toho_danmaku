// js/boss.js

import { Bullet } from './bullet.js';

export class Boss {
  constructor(x, y, width, height, hp, image, canvasWidth, bossType = 'okuu') {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.image = image;
    this.bossType = bossType; // 'okuu' (お空) または 'kisume' (キスメ)
    this.canvasWidth = canvasWidth;
    
    this.isAlive = true;
    
    // 登場後2秒間の無敵タイマー（60fps想定で120フレーム）
    this.invincibleTimer = 120;
    
    // 体力を数倍に設定
    if (this.bossType === 'okuu') {
      this.spellName = '核符「ダンシングフレア」';
      this.maxHp = 400;
      this.hp = 400;
      this.timeLimit = 60;
    } else if (this.bossType === 'okuu2') {
      this.spellName = '核符「Gフィールドアノマリー」';
      this.maxHp = 450;
      this.hp = 450;
      this.timeLimit = 60;
    } else if (this.bossType === 'okuu_final') {
      this.spellName = '「超新星爆発の残滓」';
      this.maxHp = 600;
      this.hp = 600;
      this.timeLimit = 80;
    } else if (this.bossType === 'kisume2') {
      this.spellName = '釣瓶「仄暗い井戸の底から」';
      this.maxHp = 350;
      this.hp = 350;
      this.timeLimit = 60;
    } else {
      this.spellName = '怪奇「水底より出でるは釣瓶」';
      this.maxHp = 300;
      this.hp = 300;
      this.timeLimit = 60;
    }
    
    // 魔法陣の回転角度
    this.magicCircleAngle = 0;
    
    // 弾幕用タイマーとステート
    this.lastBlueFired = 0;
    this.blueSpiralAngle = 0;     // 青・緑らせんの回転角度
    this.lastSolarFired = 0;
    
    // ボスの移動用パラメータ
    this.targetY = 100; // ボスが定位置とする高さ
    this.speed = 3;     // 移動速度
    this.moveTimer = 0; // 次の移動先を決めるまでのタイマー
    this.targetX = x;   // 次の移動先X座標
  }

  // ボスの状態をリセットする（リトライ・ボス切り替え用）
  reset(bossType = this.bossType) {
    this.bossType = bossType;
    this.x = this.startX;
    this.y = this.startY;
    this.isAlive = true;
    this.moveTimer = 0;
    this.targetX = this.startX;
    this.invincibleTimer = 120; // 無敵時間リセット
    
    if (this.bossType === 'okuu') {
      this.spellName = '核符「ダンシングフレア」';
      this.maxHp = 400; 
      this.hp = 400;
    } else if (this.bossType === 'okuu2') {
      this.spellName = '核符「Gフィールドアノマリー」';
      this.maxHp = 450;
      this.hp = 450;
    } else if (this.bossType === 'okuu_final') {
      this.spellName = '「超新星爆発の残滓」';
      this.maxHp = 600;
      this.hp = 600;
    } else if (this.bossType === 'kisume2') {
      this.spellName = '釣瓶「仄暗い井戸の底から」';
      this.maxHp = 350;
      this.hp = 350;
    } else {
      this.spellName = '怪奇「水底より出でるは釣瓶」';
      this.maxHp = 300; 
      this.hp = 300;
    }
    
    // ステート初期化
    this.lastBlueFired = 0;
    this.blueSpiralAngle = 0;
    this.lastSolarFired = 0;
    this.magicCircleAngle = 0;
  }

  update() {
    if (!this.isAlive) return;

    // 無敵タイマーのカウントダウン
    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

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
    
    // ボスの属性に合わせた美しい魔法陣の色合い
    if (this.bossType === 'okuu') {
      ctx.strokeStyle = 'rgba(255, 120, 120, 0.22)'; // 核熱の薄ピンク
    } else {
      ctx.strokeStyle = 'rgba(120, 255, 180, 0.22)'; // 井戸・新緑の淡い緑
    }
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
      
      // HPが1/4以下になると危険赤、それ以外は美しいカラー
      if (hpRatio < 0.25) {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.75)';
      } else {
        ctx.strokeStyle = this.bossType === 'okuu' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(100, 255, 100, 0.7)';
      }
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round'; // 角を丸く
      ctx.stroke();
    }
    
    ctx.restore();
  }

  draw(ctx) {
    if (!this.isAlive) return;

    // --- 予兆演出 (Attack Telegraphs) ---
    const now = Date.now();
    if (this.y >= this.targetY) {
      const bx = this.x + this.width / 2;
      const by = this.y + this.height / 2;

      if (this.bossType === 'okuu') {
        const solarInterval = this.bossType === 'okuu' ? 1400 : 1000; // 簡易的な判定
        if (now - this.lastSolarFired > solarInterval - 200) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          // 自機方向へのガイドライン (main.jsからplayer座標を渡す必要があるため、ここでは簡易的に中心方向へ)
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by + 200);
          ctx.stroke();
          ctx.restore();
        }
      } else if (this.bossType === 'kisume') {
        if (now - this.lastSolarFired > 1600 - 300) {
          ctx.save();
          ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(bx, -10);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 1. 背後の回転魔法陣を先に描画
    this.drawMagicCircle(ctx);

    // 2. ボス本体 (無敵状態の時は点滅描画して視覚的なフィードバックを付与)
    if (this.image && this.image.complete) {
      if (this.invincibleTimer > 0) {
        if (Math.floor(Date.now() / 50) % 2 === 0) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
          ctx.restore();
        } else {
          ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
      } else {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      }
    } else {
      ctx.fillStyle = this.bossType === 'okuu' ? 'red' : 'green';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // 3. ボス周囲の円形HPバーを描画
    this.drawCircleHpBar(ctx);
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0) return; // 登場直後の2秒間無敵状態の時はダメージ無効
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
  }

  // 弾幕発射メソッド (残り時間 spellTimer による弾幕変化・激化ロジック)
  // 弾幕発射メソッド (残り時間 spellTimer による弾幕変化・激化ロジック)
  fire(timestamp, playerX, playerY, spellTimer = 60) {
    const bullets = [];
    if (this.y < this.targetY) return bullets; // 定位置に降りるまでは発射しない

    const bx = this.x + this.width / 2;
    const by = this.y + this.height / 2;

    // 残り時間による「激怒段階（Phase）」の分岐 (初期時間60秒想定)
    let attackPhase = 1; // 1: 易しい, 2: 中間, 3: 激化(狂暴化)
    
    // 【霊烏路空2】 のみHPベースでフェーズ管理
    if (this.bossType === 'okuu2') {
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio > 0.66) {
            attackPhase = 1;
        } else if (hpRatio > 0.33) {
            attackPhase = 2;
        } else {
            attackPhase = 3;
        }
    } else {
        if (spellTimer > 40) {
            attackPhase = 1;
        } else if (spellTimer > 20) {
            attackPhase = 2;
        } else {
            attackPhase = 3;
        }
    }

    if (this.bossType === 'okuu') {
      // ==========================================
      // 【霊烏路空】 （時間激化）
      // ==========================================
      // パラメータの設定
      let solarFireInterval = 1400; // イージー
      let solarCount = 1;           // 1way
      let blueFireInterval = 320;
      let numBlue = 4;              // 4wayスパイラル
      let rotationSpeed = 0.06;

      if (attackPhase === 2) {
        solarFireInterval = 1050; // ミディアム
        solarCount = 2;           // 2way
        blueFireInterval = 220;
        numBlue = 6;              // 6wayスパイラル
        rotationSpeed = 0.08;
      } else if (attackPhase === 3) {
        solarFireInterval = 780;  // 激怒モード
        solarCount = 3;           // 3way
        blueFireInterval = 150;
        numBlue = 8;              // 8way超濃密スパイラル
        rotationSpeed = 0.11;     // 高速回転
      }

      // 1. 巨大太陽弾（核熱弾）の発射
      if (timestamp - this.lastSolarFired > solarFireInterval) {
        const angle = Math.atan2(playerY - by, playerX - bx);
        const solarSpeed = 2.0;
        
        if (solarCount === 1) {
          // 自機狙い1本
          bullets.push(new Bullet(bx - 70, by - 70, Math.cos(angle) * solarSpeed, Math.sin(angle) * solarSpeed, 140, 140, null, true, true));
        } else if (solarCount === 2) {
          // 少しずらした2way
          for (let i = -0.5; i <= 0.5; i += 1.0) {
            const a = angle + (i * 0.35);
            bullets.push(new Bullet(bx - 70, by - 70, Math.cos(a) * solarSpeed, Math.sin(a) * solarSpeed, 140, 140, null, true, true));
          }
        } else {
          // 密集3way
          for (let i = -1; i <= 1; i++) {
            const a = angle + (i * 0.42);
            bullets.push(new Bullet(bx - 70, by - 70, Math.cos(a) * solarSpeed, Math.sin(a) * solarSpeed, 140, 140, null, true, true));
          }
        }
        this.lastSolarFired = timestamp;
      }

      // 2. 青い粒弾らせん
      if (timestamp - this.lastBlueFired > blueFireInterval) {
        const blueSpeed = 3.6;
        for (let i = 0; i < numBlue; i++) {
          const a = this.blueSpiralAngle + (i * Math.PI * 2) / numBlue;
          const vx = Math.cos(a) * blueSpeed;
          const vy = Math.sin(a) * blueSpeed;
          bullets.push(new Bullet(bx - 7, by - 7, vx, vy, 14, 14, null, true, false, false, 'blue'));
        }
        
        this.blueSpiralAngle += rotationSpeed;
        this.lastBlueFired = timestamp;
      }
    } else if (this.bossType === 'okuu2') {
      // ==========================================
      // 【霊烏路空】
      // ==========================================
      let ringInterval = 1200;
      let ringCount = 18;
      let ringSpeed = 2.5;
      let solarInterval = 1000;
      let numSolars = 3;
      let solarSpeed = 2.2;

      if (attackPhase === 2) {
        ringInterval = 800;
        ringCount = 22;
        ringSpeed = 2.8;
        solarInterval = 700;
        numSolars = 3;
        solarSpeed = 2.6;
      } else if (attackPhase === 3) {
        ringInterval = 500;
        ringCount = 26;
        ringSpeed = 3.2;
        solarInterval = 450;
        numSolars = 4;
        solarSpeed = 3.0;
      }

      // 1. 全方位環状ショット (お空背後から波打つフレア)
      if (timestamp - this.lastBlueFired > ringInterval) {
        for (let i = 0; i < ringCount; i++) {
          const angle = (i * Math.PI * 2) / ringCount;
          bullets.push(new Bullet(bx - 7, by - 7, Math.cos(angle) * ringSpeed, Math.sin(angle) * ringSpeed, 14, 14, null, true, false, false, 'red'));
        }
        this.lastBlueFired = timestamp;
      }

      // 2. 微小サイズの太陽弾 (各方向に回転しながら発射)
      if (timestamp - this.lastSolarFired > solarInterval) {
        if (!this.solarAngleOffset) this.solarAngleOffset = 0;
        const baseAngle = this.solarAngleOffset;
        for (let i = 0; i < numSolars; i++) {
          const angle = baseAngle + (i * Math.PI * 2) / numSolars;
          bullets.push(new Bullet(bx - 50, by - 50, Math.cos(angle) * solarSpeed, Math.sin(angle) * solarSpeed, 100, 100, null, true, true));
        }
        this.solarAngleOffset += 0.35;
        this.lastSolarFired = timestamp;
      }
    } else if (this.bossType === 'kisume2') {
      // ==========================================
      // 【キスメ】 井戸符「仄暗い井戸の底から」
      // ==========================================
      let bounceInterval = 600;
      let numBounce = 1;
      let bounceSpeed = 2.5;
      let bubbleInterval = 300;
      let bubbleSpeedY = -0.8;

      if (attackPhase === 2) {
        bounceInterval = 450;
        numBounce = 2;
        bounceSpeed = 3.0;
        bubbleInterval = 200;
        bubbleSpeedY = -1.0;
      } else if (attackPhase === 3) {
        bounceInterval = 320;
        numBounce = 3;
        bounceSpeed = 3.5;
        bubbleInterval = 140;
        bubbleSpeedY = -1.3;
      }

      // 1. 左右斜め下に飛ぶ反射バウンド弾 (青小丸弾)
      if (timestamp - this.lastBlueFired > bounceInterval) {
        for (let i = 0; i < numBounce; i++) {
          const angle = Math.PI * 0.25 + (i * Math.PI * 0.5) / (numBounce - 1); // 45度〜135度
          const vx = Math.cos(angle) * bounceSpeed;
          const vy = Math.sin(angle) * bounceSpeed;
          bullets.push(new Bullet(bx - 7, by - 7, vx, vy, 14, 14, null, true, false, false, 'blue', true, false));
        }
        this.lastBlueFired = timestamp;
      }

      // 2. 井戸の底から湧き上がる水泡弾 (緑小丸弾、サイン波移動)
      if (timestamp - this.lastSolarFired > bubbleInterval) {
        const rx = Math.random() * (360 - 20) + 10;
        bullets.push(new Bullet(rx, 640, 0, bubbleSpeedY, 14, 14, null, true, false, false, 'green', false, true));
        this.lastSolarFired = timestamp;
      }

      // 3. 自機狙い泥石弾 (Phase 2 & 3 のみ)
      if (attackPhase >= 2) {
        if (!this.lastAimedFired) this.lastAimedFired = 0;
        let aimedInterval = attackPhase === 2 ? 1500 : 1000;
        if (timestamp - this.lastAimedFired > aimedInterval) {
          const angle = Math.atan2(playerY - by, playerX - bx);
          const speed = 2.2;
          bullets.push(new Bullet(bx - 7, by - 7, Math.cos(angle) * speed, Math.sin(angle) * speed, 14, 14, null, true, false, false, 'red'));
          this.lastAimedFired = timestamp;
        }
      }
    } else if (this.bossType === 'okuu_final') {
      // ==========================================
      // 【霊烏路空】（究極の核熱）
      // ==========================================
      const hpRatio = this.hp / this.maxHp;

      if (hpRatio > 0.7) {
        // Phase 1: 収縮する太陽の檻
        if (timestamp - this.lastSolarFired > 1100) {
          const num = 6;
          for (let i = 0; i < num; i++) {
            const angle = (i * Math.PI * 2) / num + this.blueSpiralAngle;
            const dist = 320;
            const sx = bx + Math.cos(angle) * dist;
            const sy = by + Math.sin(angle) * dist;
            const vx = -Math.cos(angle) * 1.8;
            const vy = -Math.sin(angle) * 1.8;
            bullets.push(new Bullet(sx - 60, sy - 60, vx, vy, 120, 120, null, true, true));
          }
          this.blueSpiralAngle += 0.3;
          this.lastSolarFired = timestamp;
        }
        if (timestamp - this.lastBlueFired > 200) {
          const a = Math.random() * Math.PI * 2;
          bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * 3.5, Math.sin(a) * 3.5, 14, 14, null, true, false, false, 'red'));
          this.lastBlueFired = timestamp;
        }
      } else if (hpRatio > 0.35) {
        // Phase 2: 連鎖爆発と極彩色螺旋
        if (timestamp - this.lastSolarFired > 1800) {
          for (let i = 0; i < 3; i++) {
            const rx = Math.random() * 300 + 30;
            const ry = Math.random() * 250 + 100;
            bullets.push(new Bullet(rx - 45, ry - 45, 0, 0, 90, 90, null, true, true, false, 'blue', false, false, {
              waitTimer: 60,
              isWaitAndGo: true,
              targetAngle: Math.random() * Math.PI * 2,
              accel: 0.08
            }));
          }
          this.lastSolarFired = timestamp;
        }
        if (timestamp - this.lastBlueFired > 70) {
          const num = 3;
          for (let i = 0; i < num; i++) {
            const a = this.blueSpiralAngle + (i * Math.PI * 2) / num;
            bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * 3, Math.sin(a) * 3, 14, 14, null, true, false, false, 'blue'));
            bullets.push(new Bullet(bx - 7, by - 7, Math.cos(-a * 1.2) * 3, Math.sin(-a * 1.2) * 3, 14, 14, null, true, false, false, 'green'));
          }
          this.blueSpiralAngle += 0.12;
          this.lastBlueFired = timestamp;
        }
      } else {
        // Phase 3: 終焉・グラビティ・リバース
        if (timestamp - this.lastBlueFired > 120) {
          const num = 10;
          const aOffset = Math.random() * Math.PI;
          for (let i = 0; i < num; i++) {
            const a = (i * Math.PI * 2) / num + aOffset;
            bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * 5, Math.sin(a) * 5, 14, 14, null, true, false, false, 'red', false, false, {
              waitTimer: 50,
              isWaitAndGo: true,
              targetAngle: Math.atan2(playerY - by, playerX - bx),
              accel: 0.12,
              maxSpeed: 7
            }));
          }
          this.lastBlueFired = timestamp;
        }
        if (timestamp - this.lastSolarFired > 1500) {
          bullets.push(new Bullet(bx - 60, by - 60, 0, 0.5, 120, 120, null, true, true));
          this.lastSolarFired = timestamp;
        }
      }
    } else {
      // ==========================================
      // 【キスメ】 （時間激化）
      // ==========================================
      // パラメータの設定
      let blueFireInterval = 380; // イージー
      let numBlue = 5;              // 5wayらせん水滴
      let rotationSpeed = 0.08;
      let solarFireInterval = 1600; 
      let numBuckets = 1;           // バケツ落下の数

      if (attackPhase === 2) {
        blueFireInterval = 250;   // ミディアム
        numBlue = 8;              // 8wayらせん水滴
        rotationSpeed = 0.12;
        solarFireInterval = 1100;
        numBuckets = 2;           // 2本落下
      } else if (attackPhase === 3) {
        blueFireInterval = 170;   // 激怒モード
        numBlue = 11;             // 11way超濃密水滴らせん
        rotationSpeed = 0.16;     // 超高速
        solarFireInterval = 750;  // 連続バケツ落とし
        numBuckets = 3;           // 3本同時落下
      }

      // 1. 水滴らせん弾幕 (緑色小丸弾)
      if (timestamp - this.lastBlueFired > blueFireInterval) {
        const blueSpeed = 2.5;
        for (let i = 0; i < numBlue; i++) {
          const a = this.blueSpiralAngle + (i * Math.PI * 2) / numBlue;
          const vx = Math.cos(a) * blueSpeed;
          const vy = Math.sin(a) * blueSpeed;
          bullets.push(new Bullet(bx - 7, by - 7, vx, vy, 14, 14, null, true, false, false, 'green'));
        }
        
        this.blueSpiralAngle += rotationSpeed;
        this.lastBlueFired = timestamp;
      }

      // 2. 釣瓶おとし（落下バケツ長弾）
      if (timestamp - this.lastSolarFired > solarFireInterval) {
        const speedY = 4.2; // 釣瓶落としの直滑降スピード
        
        for (let i = 0; i < numBuckets; i++) {
          // バケツが複数ある時は重ならないように左右に散らす
          const rx = Math.random() * (this.canvasWidth - 70) + 35;
          const ry = -10;
          bullets.push(new Bullet(rx - 20, ry, 0, speedY, 40, 40, null, true, false, true, 'brown'));
        }
        this.lastSolarFired = timestamp;
      }
    }

    return bullets;
  }
}