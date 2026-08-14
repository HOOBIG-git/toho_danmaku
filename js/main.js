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

// ボスの生成 (HP: 100, スペル名: 爆符「ペタフレア」, 制限時間: 60秒)
let boss = new Boss(
  canvas.width / 2 - 40, 
  -100, 
  80, 
  80, 
  100, 
  bossImg, 
  canvas.width, 
  '爆符「ペタフレア」', 
  60
);

let bullets = []; 
let enemyBullets = [];

// --- ゲーム状態管理 ---
let gameState = 'PLAYING'; // 'PLAYING', 'FAILED', 'CAPTURED'
let spellTimer = boss.timeLimit;
let lastTime = 0;

// 原作風スコア・スペルボーナスシステム
let playerScore = 0;
let spellBonus = 10000000; // 初期ボーナス: 1千万点
let flashTimer = 0;        // 被弾フラッシュ用のタイマー
let cautionTimer = 150;    // お空の核警報（☢ CAUTION ☢）用タイマー（150フレーム=約2.5秒）

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
  spellBonus = 10000000;
  playerScore = 0;
  flashTimer = 0;
  cautionTimer = 150; // リトライ時にCAUTION表示を再度出す
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

  // --- 1. 11面(地霊殿)核融合炉の燃え盛るプロシージャル背景 ---
  const grad = ctx.createRadialGradient(
    canvas.width / 2, 120, 40,
    canvas.width / 2, 150, 450
  );
  grad.addColorStop(0, '#2b0000'); // 中心部の深紅
  grad.addColorStop(1, '#080000'); // 外縁の漆黒
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 同心円状に広がる核融合の熱波エフェクト (ゆっくり拡大しフェードアウト)
  ctx.save();
  const time = Date.now() * 0.0008;
  ctx.strokeStyle = 'rgba(255, 68, 0, 0.06)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const radius = ((time * 80 + i * 130) % 360);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 120, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

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

    // ボスが定位置（targetY）まで降りてきてからタイマーカウント、およびスペルボーナス減衰
    if (boss.y >= boss.targetY && boss.isAlive) {
      spellTimer -= dt;
      
      // ボーナスの時間減少 (時間経過で徐々に減少し、最低100万点をキープ)
      const decay = (9000000 / boss.timeLimit) * dt;
      spellBonus -= decay;
      if (spellBonus < 1000000) {
        spellBonus = 1000000;
      }

      if (spellTimer <= 0) {
        spellTimer = 0;
        spellBonus = 0;
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
        playerScore += 100; // ダメージ毎に100点加算
        hit = true;
        
        // スペルカード取得判定
        if (!boss.isAlive) {
          gameState = 'CAPTURED';
          // スコアに最終スペルボーナスを加算！
          playerScore += Math.floor(spellBonus);
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

    // 4. 敵弾의 移動と自機への【被弾・グレイズ判定】
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let eb = enemyBullets[i];
      eb.update();

      const bx = eb.x + eb.width / 2;
      const by = eb.y + eb.height / 2;
      
      // 通常弾の当たり判定・グレイズ半径
      let bulletRadius = eb.width / 2; // 14pxの弾なら7px
      let grazeRadiusLimit = player.grazeRadius + bulletRadius;

      // ★ペタフレア太陽弾の時のみ、見た目に合わせて動的な判定を設定！
      if (eb.isSolar) {
        bulletRadius = 13; // 縮小しても被弾コアは常に極小（13px）に維持して避けやすさを実現
        // 太陽のサイズ（eb.width）の縮小に応じて、グレイズ範囲も動的に変化（太陽半径の1.35倍）
        grazeRadiusLimit = (eb.width / 2) * 1.35 + player.grazeRadius;
      }

      const dist = Math.hypot(bx - px, by - py);

      // ① 被弾判定
      if (dist < player.hitboxRadius + bulletRadius) {
        gameState = 'FAILED';
        spellBonus = 0;
        flashTimer = 15; // 被弾フラッシュを起動 (15フレーム)
        showOverlay('SPELL CARD FAILED', 'Hit by bullet', '#ff5555');
        enemyBullets.splice(i, 1);
        continue;
      }

      // ② グレイズ判定
      if (!eb.isGrazed && dist < grazeRadiusLimit) {
        eb.isGrazed = true;
        player.graze++;
        playerScore += 5000; // グレイズ1回につき5000点加算！
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

  // --- 被弾時の赤フラッシュエフェクト ---
  if (flashTimer > 0) {
    ctx.save();
    // タイマーに応じてアルファ値を徐々に減らす
    ctx.fillStyle = `rgba(255, 0, 0, ${0.4 * (flashTimer / 15)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    flashTimer--;
  }

  // --- ☢ CAUTION ☢ 警告演出 (お空戦名物、核融合炉警報) ---
  if (cautionTimer > 0 && gameState === 'PLAYING') {
    ctx.save();
    const bandHeight = 75;
    const bandY = canvas.height * 0.42 - bandHeight / 2;
    
    // 背景のダークレッド透過帯
    ctx.fillStyle = 'rgba(20, 0, 0, 0.72)';
    ctx.fillRect(0, bandY - 12, canvas.width, bandHeight + 24);
    
    // 上下の黄色と黒の警戒縞
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(canvas.width, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(canvas.width, bandY + bandHeight + 12);
    ctx.stroke();

    // 縞模様を破線で表現して警告らしさをアップ
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(canvas.width, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(canvas.width, bandY + bandHeight + 12);
    ctx.stroke();
    
    // 赤いCAUTIONの高速点滅
    const isBlink = Math.floor(Date.now() / 180) % 2 === 0;
    if (isBlink) {
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 12;
      ctx.font = '900 24px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☢ CAUTION ☢', canvas.width / 2, canvas.height * 0.42 + 8);
    }
    
    ctx.restore();
    cautionTimer--;
  }

  // --- 画面最下部：ENEMYマーカーインジケーター（ボスとX連動） ---
  if (boss.isAlive) {
    ctx.save();
    const bx = boss.x + boss.width / 2;
    // sin波で不透明度を変動させチカチカ点滅させる
    const alpha = 0.5 + Math.sin(Date.now() * 0.007) * 0.35;
    ctx.fillStyle = `rgba(255, 30, 30, ${alpha})`;
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("▲ ENEMY", bx, canvas.height - 12);
    ctx.restore();
  }

  // --- 原作風ステータスHUD描画（美しいSerifフォント「Georgia」を使用） ---
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;

  // 1. スコア
  ctx.font = 'bold 14px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#ff4d4d'; // 原作風の鮮やかな赤色ラベル
  ctx.textAlign = 'left';
  ctx.fillText('Score', 18, 26);
  
  ctx.font = 'bold 15px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerScore.toString().padStart(9, '0'), 75, 26);

  // 2. グレイズ数
  ctx.font = 'bold 14px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#4dff4d'; // 鮮やかな緑色
  ctx.fillText('Graze', 18, 48);
  
  ctx.font = 'bold 15px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(player.graze.toString().padStart(5, '0'), 75, 48);

  // 3. スペルボーナス（生存時のみ）
  if (boss.isAlive && gameState === 'PLAYING') {
    ctx.font = 'italic bold 13px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = '#ffaa00'; // 黄金色のラベル
    ctx.textAlign = 'right';
    ctx.fillText('Spell Bonus', canvas.width - 98, 26);
    
    ctx.font = 'bold 14px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.floor(spellBonus).toString().padStart(8, '0'), canvas.width - 18, 26);
  }

  // 4. 残り時間タイマー
  ctx.font = 'bold 36px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = spellTimer <= 10 ? '#ff4d4d' : '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(spellTimer).toString().padStart(2, '0'), canvas.width - 18, 75);

  // 5. スペルカード名（画面下部に斜体風描画）
  if (boss.isAlive) {
    ctx.font = 'italic 13px "Georgia", "Hiragino Kaku Gothic Pro", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'right';
    ctx.fillText(boss.spellName, canvas.width - 18, canvas.height - 28);
  }

  ctx.restore();

  // --- プレイ画面の飾り枠（原作のアーケード筐体風、ゴールド×深紅の二重枠） ---
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // ゴールドの細い外枠
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  
  ctx.strokeStyle = 'rgba(139, 0, 0, 0.55)'; // 深紅のさらに細い内枠
  ctx.lineWidth = 1.5;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// 最初のループ起動
requestAnimationFrame(gameLoop);
