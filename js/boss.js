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

    // 初期設定
    this.setBossStats();

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

  setBossStats() {
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

    this.setBossStats();

    // ステート初期化
    this.lastBlueFired = 0;
    this.blueSpiralAngle = 0;
    this.lastSolarFired = 0;
    this.magicCircleAngle = 0;
  }

  update() {
    if (!this.isAlive) return;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    if (this.y < this.targetY) {
      this.y += this.speed;
      return;
    }

    this.moveTimer--;
    if (this.moveTimer <= 0) {
      this.targetX = Math.random() * (this.canvasWidth - this.width);
      this.moveTimer = 60 + Math.random() * 60;
    }

    const dx = this.targetX - this.x;
    if (Math.abs(dx) > this.speed) {
      this.x += (dx > 0 ? this.speed : -this.speed);
    }
  }

  drawMagicCircle(ctx) {
    if (!this.isAlive) return;
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.magicCircleAngle);
    if (this.bossType === 'okuu') {
      ctx.strokeStyle = 'rgba(255, 120, 120, 0.22)';
    } else {
      ctx.strokeStyle = 'rgba(120, 255, 180, 0.22)';
    }
    ctx.lineWidth = 1.5;
    const r = 90;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    this.magicCircleAngle += 0.007;
  }

  drawCircleHpBar(ctx) {
    if (!this.isAlive) return;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width * 0.72;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2) * hpRatio);
      if (hpRatio < 0.25) {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.75)';
      } else {
        ctx.strokeStyle = this.bossType === 'okuu' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(100, 255, 100, 0.7)';
      }
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx) {
    if (!this.isAlive) return;
    const now = Date.now();
    if (this.y >= this.targetY) {
      const bx = this.x + this.width / 2;
      const by = this.y + this.height / 2;
      if (this.bossType === 'okuu') {
        const solarInterval = this.bossType === 'okuu' ? 1400 : 1000;
        if (now - this.lastSolarFired > solarInterval - 200) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
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
    this.drawMagicCircle(ctx);
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
    this.drawCircleHpBar(ctx);
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
  }

  fire(timestamp, playerX, playerY, spellTimer = 60) {
    const bullets = [];
    if (this.y < this.targetY) return bullets;

    const bx = this.x + this.width / 2;
    const by = this.y + this.height / 2;

    let attackPhase = 1;
    if (this.bossType === 'okuu2') {
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio > 0.66) attackPhase = 1;
        else if (hpRatio > 0.33) attackPhase = 2;
        else attackPhase = 3;
    } else {
        if (spellTimer > 40) attackPhase = 1;
        else if (spellTimer > 20) attackPhase = 2;
        else attackPhase = 3;
    }

    if (this.bossType === 'okuu_final') {
      const hpRatio = this.hp / this.maxHp;
      if (hpRatio > 0.66) {
        if (timestamp - this.lastSolarFired > 1200) {
          const angle = Math.atan2(playerY - by, playerX - bx);
          bullets.push(new Bullet(bx - 30, by - 30, Math.cos(angle) * 2, Math.sin(angle) * 2, 60, 60, null, true, false, false, 'red', false, false, { splitTimer: 60, colorType: 'red' }));
          this.lastSolarFired = timestamp;
        }
        if (timestamp - this.lastBlueFired > 800) {
          const rx = Math.random() * this.canvasWidth;
          const ry = Math.random() * 300;
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8;
            bullets.push(new Bullet(rx - 7, ry - 7, Math.cos(a) * 2.5, Math.sin(a) * 2.5, 14, 14, null, true, false, false, 'blue'));
          }
          this.lastBlueFired = timestamp;
        }
      } else if (hpRatio > 0.33) {
        if (timestamp - this.lastBlueFired > 250) {
          const ringCount = 1;
          const bulletsPerRing = 8;
          const time = timestamp * 0.001;
          for (let r = 0; r < ringCount; r++) {
            const radius = 60 + r * 40;
            const rotateOffset = r * 1.5;
            for (let i = 0; i < bulletsPerRing; i++) {
              const a = (i * Math.PI * 2) / bulletsPerRing + time + rotateOffset;
              bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * 1.5, Math.sin(a) * 1.5, 14, 14, null, true, false, false, 'blue'));
            }
          }
          this.lastBlueFired = timestamp;
        }
        if (timestamp - this.lastSolarFired > 2000) {
          const angle = Math.atan2(playerY - by, playerX - bx);
          bullets.push(new Bullet(bx - 20, by - 20, Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 40, 40, null, true, true, false, 'orange'));
          this.lastSolarFired = timestamp;
        }
      } else {
        // Phase 3: 特異点層「シンギュラリティ・レイヤー」
        const cycleTime = timestamp % 5000;

        if (timestamp - this.lastBlueFired > 300) {
          const time = timestamp * 0.001;
          const ringConfigs = [
            { count: 12, speed: 3.5, offset: 0 },    // 高速層
            { count: 12, speed: 2.2, offset: Math.PI / 12 }, // 中速層
            { count: 12, speed: 1.2, offset: Math.PI / 6 }   // 低速層
          ];
          ringConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
              const a = (i * Math.PI * 2) / config.count + time + config.offset;
              bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * config.speed, Math.sin(a) * config.speed, 14, 14, null, true, false, false, 'red'));
            }
          });
          this.lastBlueFired = timestamp;
        }

        if (cycleTime > 1000 && cycleTime < 3000) {
          if (timestamp - this.lastSolarFired > 600) {
            const numFlares = 4;
            for (let i = 0; i < numFlares; i++) {
              const a = (i * Math.PI / 2) + (timestamp * 0.001);
              bullets.push(new Bullet(bx - 7, by - 7, Math.cos(a) * 6, Math.sin(a) * 6, 14, 14, null, true, false, false, 'orange'));
            }
            this.lastSolarFired = timestamp;
          }
        }

        if (cycleTime > 3000) {
          if (timestamp - this.lastBlueFired > 150) {
            const num = 8;
            for (let i = 0; i < num; i++) {
              const a = Math.random() * Math.PI * 2;
              const sx = bx + Math.cos(a) * 600;
              const sy = by + Math.sin(a) * 600;
              bullets.push(new Bullet(sx - 7, sy - 7, 0, 0, 14, 14, null, true, false, false, 'red', false, false, {
                behavior: 'converge',
                targetX: bx,
                targetY: by,
                accel: 0.05,
                maxSpeed: 1.5
              }));
            }
            this.lastBlueFired = timestamp;
          }
        }
      }
      return bullets;

    } else if (this.bossType === 'okuu') {
      // ==========================================
      // 【霊烏路空】 （時間激化）
      // ==========================================
      let solarFireInterval = 1400, solarCount = 1, blueFireInterval = 320, numBlue = 4, rotationSpeed = 0.06;
      let fissionInterval = 2000, numFission = 2;

      if (attackPhase === 2) {
        solarFireInterval = 1050; solarCount = 2; blueFireInterval = 220; numBlue = 6; rotationSpeed = 0.08;
        fissionInterval = 1500; numFission = 3;
      } else if (attackPhase === 3) {
        solarFireInterval = 780; solarCount = 3; blueFireInterval = 150; numBlue = 8; rotationSpeed = 0.11;
        fissionInterval = 1000; numFission = 4;
      }

      // 1. 超巨大太陽弾（核の脈動）
      if (timestamp - this.lastSolarFired > solarFireInterval) {
        const angle = Math.atan2(playerY - by, playerX - bx);
        const solarSpeed = 2.0;
        if (solarCount === 1) {
          bullets.push(new Bullet(bx - 100, by - 100, Math.cos(angle) * solarSpeed, Math.sin(angle) * solarSpeed, 200, 200, null, true, true));
        } else if (solarCount === 2) {
          for (let i = -0.5; i <= 0.5; i += 1.0) {
            const a = angle + (i * 0.35);
            bullets.push(new Bullet(bx - 100, by - 100, Math.cos(a) * solarSpeed, Math.sin(a) * solarSpeed, 200, 200, null, true, true));
          }
        } else {
          for (let i = -1; i <= 1; i++) {
            const a = angle + (i * 0.42);
            bullets.push(new Bullet(bx - 100, by - 100, Math.cos(a) * solarSpeed, Math.sin(a) * solarSpeed, 200, 200, null, true, true));
          }
        }
        this.lastSolarFired = timestamp;
      }

      // 2. 核分裂弾（Fission Bullet）
      if (timestamp - (this.lastFissionFired || 0) > fissionInterval) {
        for (let i = 0; i < numFission; i++) {
          const a = (i * Math.PI * 2) / numFission + (timestamp * 0.001);
          bullets.push(new Bullet(bx - 15, by - 15, Math.cos(a) * 2.5, Math.sin(a) * 2.5, 30, 30, null, true, false, false, 'red', false, false, {
            splitTimer: 80,
            colorType: 'red'
          }));
        }
        this.lastFissionFired = timestamp;
      }

      // 3. 青い粒弾らせん
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
      let ringInterval = 1200, ringCount = 18, ringSpeed = 2.5, solarInterval = 1000, numSolars = 3, solarSpeed = 2.2;
      if (attackPhase === 2) {
        ringInterval = 800; ringCount = 22; ringSpeed = 2.8; solarInterval = 700; numSolars = 3; solarSpeed = 2.6;
      } else if (attackPhase === 3) {
        ringInterval = 500; ringCount = 26; ringSpeed = 3.2; solarInterval = 450; numSolars = 4; solarSpeed = 3.0;
      }
      if (timestamp - this.lastBlueFired > ringInterval) {
        for (let i = 0; i < ringCount; i++) {
          const angle = (i * Math.PI * 2) / ringCount;
          bullets.push(new Bullet(bx - 7, by - 7, Math.cos(angle) * ringSpeed, Math.sin(angle) * ringSpeed, 14, 14, null, true, false, false, 'red'));
        }
        this.lastBlueFired = timestamp;
      }
      if (timestamp - this.lastSolarFired > solarInterval) {
        if (!this.solarAngleOffset) this.solarAngleOffset = 0;
        for (let i = 0; i < numSolars; i++) {
          const angle = this.solarAngleOffset + (i * Math.PI * 2) / numSolars;
          bullets.push(new Bullet(bx - 50, by - 50, Math.cos(angle) * solarSpeed, Math.sin(angle) * solarSpeed, 100, 100, null, true, true));
        }
        this.solarAngleOffset += 0.35;
        this.lastSolarFired = timestamp;
      }
    } else if (this.bossType === 'kisume2') {
      let bounceInterval = 600, numBounce = 1, bounceSpeed = 2.5, bubbleInterval = 300, bubbleSpeedY = -0.8;
      if (attackPhase === 2) {
        bounceInterval = 450; numBounce = 2; bounceSpeed = 3.0; bubbleInterval = 200; bubbleSpeedY = -1.0;
      } else if (attackPhase === 3) {
        bounceInterval = 320; numBounce = 3; bounceSpeed = 3.5; bubbleInterval = 140; bubbleSpeedY = -1.3;
      }
      if (timestamp - this.lastBlueFired > bounceInterval) {
        for (let i = 0; i < numBounce; i++) {
          const angle = Math.PI * 0.25 + (i * Math.PI * 0.5) / (numBounce - 1 || 1);
          const vx = Math.cos(angle) * bounceSpeed;
          const vy = Math.sin(angle) * bounceSpeed;
          bullets.push(new Bullet(bx - 7, by - 7, vx, vy, 14, 14, null, true, false, false, 'blue', true, false));
        }
        this.lastBlueFired = timestamp;
      }
      if (timestamp - this.lastSolarFired > bubbleInterval) {
        const rx = Math.random() * (this.canvasWidth - 20) + 10;
        bullets.push(new Bullet(rx, 640, 0, bubbleSpeedY, 14, 14, null, true, false, false, 'green', false, true));
        this.lastSolarFired = timestamp;
      }
    } else {
      let blueFireInterval = 380, numBlue = 5, rotationSpeed = 0.08, solarFireInterval = 1600, numBuckets = 1;
      if (attackPhase === 2) {
        blueFireInterval = 250; numBlue = 8; rotationSpeed = 0.12; solarFireInterval = 1100; numBuckets = 2;
      } else if (attackPhase === 3) {
        blueFireInterval = 170; numBlue = 11; rotationSpeed = 0.16; solarFireInterval = 750; numBuckets = 3;
      }
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
      if (timestamp - this.lastSolarFired > solarFireInterval) {
        const speedY = 4.2;
        for (let i = 0; i < numBuckets; i++) {
          const rx = Math.random() * (this.canvasWidth - 70) + 35;
          bullets.push(new Bullet(rx - 20, -10, 0, speedY, 40, 40, null, true, false, true, 'brown'));
        }
        this.lastSolarFired = timestamp;
      }
    }
    return bullets;
  }
}
