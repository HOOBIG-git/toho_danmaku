// js/main.js

import { InputManager } from './input.js';
import { Player } from './player.js';
import { Boss } from './boss.js';
// import { Item } from './item.js';
import { Bullet } from './bullet.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const controlPad = document.getElementById('controlPad');
const joyCanvas = document.getElementById('joyCanvas');
const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ★原作準拠：プレイ領域(左80%) と 縦型ステータスサイドバー(右20%) に分割
const PLAY_WIDTH = 360;
const PLAY_HEIGHT = 640;
const SIDEBAR_X = 360;
const SIDEBAR_WIDTH = 120;

function resizeCanvas() {
  joyCanvas.width = controlPad.clientWidth; 
  joyCanvas.height = controlPad.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 画像の読み込み ---
const playerImg = new Image(); playerImg.src = 'assets/player.png';
const playerLImg = new Image(); playerLImg.src = 'assets/playerL.png';
const playerRImg = new Image(); playerRImg.src = 'assets/playerR.png';
const playerBulletImg = new Image(); playerBulletImg.src = 'assets/playerbullet.png';
const bulletImg = new Image(); bulletImg.src = 'assets/bullet.png';
const okuuImg = new Image(); okuuImg.src = 'assets/enemy.png';
const kisumeImg = new Image(); kisumeImg.src = 'assets/kisume.png';

// --- インスタンスの生成 ---
const input = new InputManager(controlPad, joyCanvas);
const player = new Player(PLAY_WIDTH / 2, PLAY_HEIGHT * 0.8, playerImg, playerLImg, playerRImg, playerBulletImg);

let boss = new Boss(
  PLAY_WIDTH / 2 - 40, 
  -100, 
  80, 
  80, 
  100, 
  okuuImg, 
  PLAY_WIDTH, 
  'okuu'
);

let bullets = []; 
let enemyBullets = [];
let items = [];

// --- ゲーム状態管理 ---
let gameState = 'AUTH'; // 'AUTH', 'TITLE', 'PLAYING', 'FAILED', 'CAPTURED'
let spellTimer = boss.timeLimit;
let lastTime = 0;

// 原作風スコア・スペルボーナスシステム
let playerScore = 0;
let spellBonus = 10000000;
let flashTimer = 0;
let cautionTimer = 150;

// スクリーンシェイク用ステート
let shakeTimer = 0;
let shakeIntensity = 0;

function triggerShake(duration, intensity) {
  shakeTimer = duration;
  shakeIntensity = intensity;
}

// HTML要素の取得
const titleScreen = document.getElementById('titleScreen');
const overlay = document.getElementById('overlay');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const retryButton = document.getElementById('retryButton');
const titleButton = document.getElementById('titleButton');

// パスワード認証画面の制御
const CORRECT_PASSWORD = 'touhoudaisuki'; // 合言葉

const passwordScreen = document.getElementById('passwordScreen');
const passInput = document.getElementById('passInput');
const passSubmitBtn = document.getElementById('passSubmitBtn');
const passError = document.getElementById('passError');

function checkPassword() {
  const entered = passInput.value.trim();

  if (entered === CORRECT_PASSWORD) {
    passInput.blur();
    passError.classList.remove('visible');
    
    passwordScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
    gameState = 'TITLE';
  } else {
    passError.classList.add('visible');
    passInput.value = '';
    passInput.focus();
    triggerShake(8, 4);
  }
}

passSubmitBtn.addEventListener('click', checkPassword);
passSubmitBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  checkPassword();
});

passInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    checkPassword();
  }
});

// ボス選択ボタンのイベント割り当て
document.querySelectorAll('.boss-select-btn').forEach(btn => {
  const selectBoss = (e) => {
    e.preventDefault();
    const type = btn.getAttribute('data-boss');
    
    player.reset();
    
    if (type === 'okuu') {
      boss.image = okuuImg;
      boss.reset('okuu');
    } else {
      boss.image = kisumeImg;
      boss.reset('kisume');
    }
    
    bullets = [];
    enemyBullets = [];
    items = [];
    playerScore = 0;
    spellTimer = boss.timeLimit;
    spellBonus = 10000000;
    cautionTimer = 150;
    lastTime = 0;
    
    titleScreen.classList.add('hidden');
    gameState = 'PLAYING';
  };
  
  btn.addEventListener('click', selectBoss);
  btn.addEventListener('touchstart', selectBoss, { passive: false });
});

// オーバーレイ表示関数
function showOverlay(title, subtitle, color) {
  resultTitle.textContent = title;
  resultTitle.style.color = color;
  resultSubtitle.textContent = subtitle;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// ゲームリセット（リトライ）
function resetGame() {
  gameState = 'PLAYING';
  spellTimer = boss.timeLimit;
  spellBonus = 10000000;
  playerScore = 0;
  flashTimer = 0;
  cautionTimer = 150;
  shakeTimer = 0;
  shakeIntensity = 0;
  lastTime = 0;
  
  player.reset();
  boss.reset();
  
  bullets = [];
  enemyBullets = [];
  items = [];
  
  hideOverlay();
}

retryButton.addEventListener('click', resetGame);
retryButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  resetGame();
});

const returnToTitle = () => {
  hideOverlay();
  titleScreen.classList.remove('hidden');
  gameState = 'TITLE';
};

titleButton.addEventListener('click', returnToTitle);
titleButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  returnToTitle();
});

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// --- ゲームループ ---
function gameLoop(timestamp) {
  input.update();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // スクリーンシェイク処理
  ctx.save();
  if (shakeTimer > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeTimer--;
  }

  // --- 1. 背景描画（ボスにより動的切り替え） ---
  let grad;
  if (boss.bossType === 'okuu') {
    grad = ctx.createRadialGradient(
      PLAY_WIDTH / 2, 120, 40,
      PLAY_WIDTH / 2, 150, 400
    );
    grad.addColorStop(0, '#2b0000');
    grad.addColorStop(1, '#080000');
  } else {
    grad = ctx.createRadialGradient(
      PLAY_WIDTH / 2, 120, 30,
      PLAY_WIDTH / 2, 200, 420
    );
    grad.addColorStop(0, '#021f18');
    grad.addColorStop(1, '#020608');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

  // 同心円状の熱波/波紋エフェクト
  ctx.save();
  ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
  ctx.clip();
  const time = Date.now() * 0.0008;
  ctx.strokeStyle = boss.bossType === 'okuu' ? 'rgba(255, 68, 0, 0.06)' : 'rgba(80, 220, 100, 0.06)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const radius = ((time * 80 + i * 130) % 360);
    ctx.beginPath();
    ctx.arc(PLAY_WIDTH / 2, 120, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // パスワード入力中・タイトル画面中は待機
  if (gameState === 'AUTH' || gameState === 'TITLE') {
    ctx.save();
    ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.clip();
    
    player.draw(ctx, input);
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, PLAY_WIDTH - 10, PLAY_HEIGHT - 10);
    ctx.restore();
    
    ctx.restore();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === 'PLAYING') {
    // 0. ボム（スペル）判定
    if (input.isBombRequested) {
      input.isBombRequested = false;
      if (player.bombs > 0) {
        player.bombs--;
        player.bombTimer = 180;
        triggerShake(30, 8);
        enemyBullets = [];
        
        if (boss.isAlive && boss.y >= boss.targetY) {
          const damaged = boss.takeDamage(15);
          if (damaged && !boss.isAlive) {
            gameState = 'CAPTURED';
            playerScore += Math.floor(spellBonus);
            showOverlay('SPELL CARD CAPTURED', boss.spellName, '#ffdd44');
          }
        }
      }
    }

    // 1. 自機の更新とショット
    player.update(input, PLAY_WIDTH, PLAY_HEIGHT);
    bullets.push(...player.fire(timestamp, input));

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    // 2. ボスの更新と敵弾発射
    if (boss.isAlive) {
      boss.update();
      
      const oldLen = enemyBullets.length;
      enemyBullets.push(...boss.fire(timestamp, px, py, spellTimer));
      const newLen = enemyBullets.length;
      
      let hasSolarShot = false;
      for (let idx = oldLen; idx < newLen; idx++) {
        if (enemyBullets[idx] && enemyBullets[idx].isSolar) {
          hasSolarShot = true;
          break;
        }
      }
      if (hasSolarShot) {
        triggerShake(10, 4.5);
      }
    }

    // タイマー更新
    if (lastTime === 0) {
      lastTime = timestamp;
    }
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (boss.y >= boss.targetY && boss.isAlive) {
      spellTimer -= dt;
      
      const decay = (9000000 / boss.timeLimit) * dt;
      spellBonus -= decay;
      if (spellBonus < 1000000) spellBonus = 1000000;

      if (spellTimer <= 0) {
        spellTimer = 0;
        spellBonus = 0;
        gameState = 'FAILED';
        showOverlay('SPELL CARD FAILED', 'Time Up !', '#ff5555');
      }
    }

    // 3. 自機弾の移動とボスとの当たり判定
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      b.update();
      let hit = false;

      if (boss.isAlive && checkCollision(b, boss)) {
        const damaged = boss.takeDamage(1);
        if (damaged) {
          playerScore += 100;
        }
        hit = true;
        
        if (!boss.isAlive) {
          gameState = 'CAPTURED';
          playerScore += Math.floor(spellBonus);
          showOverlay('SPELL CARD CAPTURED', boss.spellName, '#ffdd44');
        }
      }

      if (hit) {
        bullets.splice(i, 1);
        continue;
      }

      if (b.isOutOfBounds(PLAY_WIDTH, PLAY_HEIGHT)) {
        bullets.splice(i, 1);
      }
    }

    // 4. 敵弾の移動と被弾・グレイズ判定
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let eb = enemyBullets[i];
      eb.update();

      // キスメのバケツ弾分裂
      if (eb.isBucket && eb.y > 450) {
        triggerShake(5, 2.0);
        const numShards = 10;
        const shardSpeed = 2.4;
        const ex = eb.x + eb.width / 2;
        const ey = eb.y + eb.height / 2;
        for (let j = 0; j < numShards; j++) {
          const a = (j * Math.PI * 2) / numShards;
          const vx = Math.cos(a) * shardSpeed;
          const vy = Math.sin(a) * shardSpeed;
          // 緑色の破片弾を射出
          enemyBullets.push(new Bullet(ex - 7, ey - 7, vx, vy, 14, 14, null, true, false, false, 'green'));
        }
        enemyBullets.splice(i, 1);
        continue;
      }

      const bx = eb.x + eb.width / 2;
      const by = eb.y + eb.height / 2;
      
      let bulletRadius = eb.width / 2;
      let grazeRadiusLimit = player.grazeRadius + bulletRadius;

      if (eb.isSolar) {
        bulletRadius = 13;
        grazeRadiusLimit = (eb.width / 2) * 1.35 + player.grazeRadius;
      } else if (eb.isBucket) {
        bulletRadius = 16;
        grazeRadiusLimit = eb.width * 0.7 + player.grazeRadius;
      }

      if (player.isInvincible()) {
        continue;
      }

      const dist = Math.hypot(bx - px, by - py);

      // 被弾判定
      if (dist < player.hitboxRadius + bulletRadius) {
        if (player.lives > 0) {
          player.lives--;
          player.invincibleTimer = 120;
          flashTimer = 15;
          triggerShake(20, 8);
          enemyBullets = [];
          break;
        } else {
          gameState = 'FAILED';
          spellBonus = 0;
          flashTimer = 15;
          triggerShake(24, 14);
          showOverlay('SPELL CARD FAILED', 'Hit by bullet', '#ff5555');
          enemyBullets.splice(i, 1);
          continue;
        }
      }

      // グレイズ判定
      if (!eb.isGrazed && dist < grazeRadiusLimit) {
        eb.isGrazed = true;
        player.graze++;
        playerScore += 5000;
      }

      if (eb.isOutOfBounds(PLAY_WIDTH, PLAY_HEIGHT)) {
        enemyBullets.splice(i, 1);
      }
    }

    // お空戦のアラーム振動演出
    if (boss.bossType === 'okuu') {
      if (cautionTimer === 135) triggerShake(15, 6.0);
      if (cautionTimer === 85) triggerShake(15, 6.0);
      if (cautionTimer === 35) triggerShake(25, 9.0);
    }
  } else {
    lastTime = 0;
  }

  // --- 描画処理（プレイエリア内） ---
  ctx.save();
  ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
  ctx.clip();
  
  for (let b of bullets) b.draw(ctx);
  for (let eb of enemyBullets) eb.draw(ctx);
  if (boss.isAlive || gameState === 'CAPTURED') boss.draw(ctx);

  if (player.bombTimer > 0) {
    const bombProgress = (180 - player.bombTimer) / 180;
    const radius = bombProgress * 600;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    
    const grad = ctx.createRadialGradient(px, py, radius * 0.1, px, py, radius);
    grad.addColorStop(0, 'rgba(0, 255, 100, 0)');
    grad.addColorStop(0.8, 'rgba(0, 255, 100, 0.45)');
    grad.addColorStop(0.95, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
    
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    enemyBullets = [];
  }

  player.draw(ctx, input);
  ctx.restore();
  
  input.draw();

  // 被弾フラッシュ
  if (flashTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.4 * (flashTimer / 15)})`;
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.restore();
    flashTimer--;
  }

  // ☢ CAUTION ☢ 警告演出
  if (boss.bossType === 'okuu' && cautionTimer > 0 && gameState === 'PLAYING') {
    ctx.save();
    ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.clip();
    const bandHeight = 75;
    const bandY = canvas.height * 0.42 - bandHeight / 2;
    
    ctx.fillStyle = 'rgba(20, 0, 0, 0.72)';
    ctx.fillRect(0, bandY - 12, PLAY_WIDTH, bandHeight + 24);
    
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(PLAY_WIDTH, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(PLAY_WIDTH, bandY + bandHeight + 12);
    ctx.stroke();

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(PLAY_WIDTH, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(PLAY_WIDTH, bandY + bandHeight + 12);
    ctx.stroke();
    
    const isBlink = Math.floor(Date.now() / 180) % 2 === 0;
    if (isBlink) {
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 12;
      ctx.font = '900 24px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☢ CAUTION ☢', PLAY_WIDTH / 2, canvas.height * 0.42 + 8);
    }
    
    ctx.restore();
    cautionTimer--;
  }

  // ENEMYマーカー
  if (boss.isAlive) {
    ctx.save();
    const bx = boss.x + boss.width / 2;
    const alpha = 0.5 + Math.sin(Date.now() * 0.007) * 0.35;
    ctx.fillStyle = `rgba(255, 30, 30, ${alpha})`;
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("▲ ENEMY", bx, canvas.height - 12);
    ctx.restore();
  }

  // 飾り枠
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, PLAY_WIDTH - 10, PLAY_HEIGHT - 10);
  
  ctx.strokeStyle = 'rgba(139, 0, 0, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(9, 9, PLAY_WIDTH - 18, PLAY_HEIGHT - 18);
  ctx.restore();

  // サイドバーHUD描画
  ctx.save();
  ctx.fillStyle = '#121214';
  ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, GAME_HEIGHT);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_X, 0);
  ctx.lineTo(SIDEBAR_X, GAME_HEIGHT);
  ctx.stroke();

  ctx.strokeStyle = '#220000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_X - 3, 0);
  ctx.lineTo(SIDEBAR_X - 3, GAME_HEIGHT);
  ctx.stroke();

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1.2;
  ctx.shadowOffsetY = 1.2;

  const hx = SIDEBAR_X + 15;

  ctx.font = 'bold 10px "Georgia", serif';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'left';
  ctx.fillText('SPELL PRACTICE', hx, 30);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Hi-Score', hx, 65);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('999999990', hx, 82);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Score', hx, 115);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerScore.toString().padStart(9, '0'), hx, 132);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Player', hx, 175);
  
  ctx.font = 'bold 14px "Georgia", "Arial", sans-serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('★ '.repeat(player.lives).trim() || 'None', hx, 192);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Spell', hx, 225);
  
  ctx.font = 'bold 14px "Georgia", "Arial", sans-serif';
  ctx.fillStyle = '#4dff4d';
  ctx.fillText('★ '.repeat(player.bombs).trim() || 'None', hx, 242);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Power', hx, 285);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(player.power.toFixed(2) + ' / 4.00', hx, 302);

  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#4dff4d'; 
  ctx.fillText('Graze', hx, 345);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(player.graze.toString().padStart(5, '0'), hx, 362);

  if (boss.isAlive && gameState === 'PLAYING') {
    ctx.font = 'italic bold 11px "Georgia", serif';
    ctx.fillStyle = '#ffaa00'; 
    ctx.fillText('Spell Bonus', hx, 415);
    
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.floor(spellBonus).toString().padStart(8, '0'), hx, 432);
  }
  ctx.restore();

  // プレイエリア内のタイマー＆スペル名
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;

  ctx.font = 'bold 34px "Georgia", serif';
  ctx.fillStyle = spellTimer <= 10 ? '#ff4d4d' : '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(spellTimer).toString().padStart(2, '0'), 350, 40);

  if (boss.isAlive) {
    ctx.font = 'italic 12px "Georgia", "Hiragino Kaku Gothic Pro", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(boss.spellName, 350, 615);
  }
  ctx.restore();

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

// ループ起動
requestAnimationFrame(gameLoop);