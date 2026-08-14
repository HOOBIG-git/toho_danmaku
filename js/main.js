// js/main.js

import { InputManager } from './input.js';
import { Player } from './player.js';
import { Boss } from './boss.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const controlPad = document.getElementById('controlPad');
const joyCanvas = document.getElementById('joyCanvas');
const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

function resizeCanvas() {
  joyCanvas.width = controlPad.clientWidth; 
  joyCanvas.height = controlPad.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 画像の読み込み ---
const playerImg = new Image(); playerImg.src = 'assets/player.png';
const bulletImg = new Image(); bulletImg.src = 'assets/bullet.png';
const bossImg = new Image(); bossImg.src = 'assets/enemy.png';

// --- インスタンスの生成 ---
const input = new InputManager(controlPad, joyCanvas);
const player = new Player(canvas.width / 2, canvas.height * 0.8, playerImg, bulletImg);

// ボスの生成 (HP: 100, スペル名: 古代の法則「古代の宇宙」, 制限時間: 60秒)
let boss = new Boss(
  canvas.width / 2 - 40, 
  -100, 
  80, 
  80, 
  100, 
  bossImg, 
  canvas.width, 
  '古代の法則「古代の宇宙」', 
  60
);

let bullets = []; 
let enemyBullets = [];

// --- ゲーム状態管理 ---
let gameState = 'PLAYING'; // 'PLAYING', 'FAILED', 'CAPTURED'
let spellTimer = boss.timeLimit;
let lastTime = 0;

// HTMLオーバーレイ要素の取得
const overlay = document.getElementById('overlay');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const retryButton = document.getElementById('retryButton');

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
  lastTime = 0;
  
  player.reset();
  boss.reset();
  
  bullets = [];
  enemyBullets = [];
  
  hideOverlay();
}

// リトライボタンにイベントを紐付け
retryButton.addEventListener('click', resetGame);
retryButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  resetGame();
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
  // PCキーボード入力等の更新
  input.update();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'PLAYING') {
    // 1. 自機の更新とショット
    player.update(input, canvas.width, canvas.height);
    bullets.push(...player.fire(timestamp, input));

    // 2. ボスの更新と【敵弾の発射】
    if (boss.isAlive) {
      boss.update();
      // ボスから自機の中心座標へ向けて弾を撃たせる
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      enemyBullets.push(...boss.fire(timestamp, px, py));
    }

    // タイマー更新
    if (lastTime === 0) {
      lastTime = timestamp;
    }
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // ボスが定位置（targetY）まで降りてきてからタイマーをカウントダウン開始
    if (boss.y >= boss.targetY && boss.isAlive) {
      spellTimer -= dt;
      if (spellTimer <= 0) {
        spellTimer = 0;
        gameState = 'FAILED';
        showOverlay('SPELL CARD FAILED', 'Time Up !', '#ff5555');
      }
    }

    // 3. 自機弾の移動とボスとの【当たり判定】
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      b.update();

      let hit = false;

      if (boss.isAlive && checkCollision(b, boss)) {
        boss.takeDamage(1); // ボスに1ダメージ
        hit = true;
        
        // スペルカード取得判定
        if (!boss.isAlive) {
          gameState = 'CAPTURED';
          showOverlay('SPELL CARD CAPTURED', boss.spellName, '#ffdd44');
        }
      }

      if (hit) {
        bullets.splice(i, 1);
        continue;
      }

      if (b.isOutOfBounds(canvas.width, canvas.height)) {
        bullets.splice(i, 1);
      }
    }

    // 4. 敵弾の移動と自機への【被弾・グレイズ判定】
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let eb = enemyBullets[i];
      eb.update();

      const bx = eb.x + eb.width / 2;
      const by = eb.y + eb.height / 2;
      const bulletRadius = eb.width / 2;

      const dist = Math.hypot(bx - px, by - py);

      // ① 被弾判定
      if (dist < player.hitboxRadius + bulletRadius) {
        gameState = 'FAILED';
        showOverlay('SPELL CARD FAILED', 'Hit by bullet', '#ff5555');
        enemyBullets.splice(i, 1);
        continue;
      }

      // ② グレイズ判定
      if (!eb.isGrazed && dist < player.grazeRadius + bulletRadius) {
        eb.isGrazed = true;
        player.graze++;
      }

      if (eb.isOutOfBounds(canvas.width, canvas.height)) {
        enemyBullets.splice(i, 1);
      }
    }
  } else {
    // FAILED または CAPTURED 時は delta time 計算用の基準時刻をリセット
    lastTime = 0;
  }

  // --- 描画処理（全ステート共通） ---
  
  // 自機弾の描画
  for (let b of bullets) {
    b.draw(ctx);
  }
  
  // 敵弾の描画
  for (let eb of enemyBullets) {
    eb.draw(ctx);
  }

  // ボスの描画
  if (boss.isAlive || gameState === 'CAPTURED') {
    boss.draw(ctx);
  }

  // 自機の描画
  player.draw(ctx, input);
  
  // 仮想パッドの描画
  input.draw();

  // グレイズ数を表示
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`GRAZE: ${player.graze}`, 10, 30);

  // タイマーを表示
  ctx.fillStyle = spellTimer <= 10 ? '#ff5555' : 'white';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(spellTimer).toString().padStart(2, '0'), canvas.width - 20, 40);

  // スペルカード名を表示（ボス生存時のみ）
  if (boss.isAlive) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(boss.spellName, canvas.width - 15, canvas.height - 20);
  }

  requestAnimationFrame(gameLoop);
}

// 最初のループ起動
requestAnimationFrame(gameLoop);
