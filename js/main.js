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
const bulletImg = new Image(); bulletImg.src = 'assets/bullet.png';
const bossImg = new Image(); bossImg.src = 'assets/enemy.png';

// --- インスタンスの生成 ---
const input = new InputManager(controlPad, joyCanvas);
// プレイヤーはプレイ領域の中心下部に生成
const player = new Player(PLAY_WIDTH / 2, PLAY_HEIGHT * 0.8, playerImg, bulletImg);

// ボスの生成 (HP: 100, スペル名: 爆符「ペタフレア」, 制限時間: 60秒)
// ボスの移動範囲（canvasWidth）を PLAY_WIDTH (360px) に制限することで、プレイ領域から出ないようにします
let boss = new Boss(
  PLAY_WIDTH / 2 - 40, 
  -100, 
  80, 
  80, 
  100, 
  bossImg, 
  PLAY_WIDTH, 
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

// スクリーンシェイク（画面揺れ）用ステート
let shakeTimer = 0;
let shakeIntensity = 0;

function triggerShake(duration, intensity) {
  shakeTimer = duration;
  shakeIntensity = intensity;
}

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
  shakeTimer = 0;
  shakeIntensity = 0;
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

  // ★追加：スクリーンシェイク（画面揺れ）処理
  ctx.save();
  if (shakeTimer > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeTimer--;
  }

  // --- 1. 11面(地霊殿)核融合炉の燃え盛るプロシージャル背景 (プレイ領域のみに限定して描画) ---
  const grad = ctx.createRadialGradient(
    PLAY_WIDTH / 2, 120, 40,
    PLAY_WIDTH / 2, 150, 400
  );
  grad.addColorStop(0, '#2b0000'); // 中心部の深紅
  grad.addColorStop(1, '#080000'); // 外縁の漆黒
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

  // 同心円状に広がる核融合の熱波エフェクト (プレイ領域のみでクリップ)
  ctx.save();
  ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
  ctx.clip();
  const time = Date.now() * 0.0008;
  ctx.strokeStyle = 'rgba(255, 68, 0, 0.06)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const radius = ((time * 80 + i * 130) % 360);
    ctx.beginPath();
    ctx.arc(PLAY_WIDTH / 2, 120, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  if (gameState === 'PLAYING') {
    // 1. 自機の更新とショット (プレイ領域 PLAY_WIDTH の境界値を渡す)
    player.update(input, PLAY_WIDTH, PLAY_HEIGHT);
    bullets.push(...player.fire(timestamp, input));

    // 2. ボスの更新と【敵弾の発射】
    if (boss.isAlive) {
      boss.update();
      // ボスから自機の中心座標へ向けて弾を撃たせる
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      
      // 弾幕の配列サイズを射出前と後で比較して、新規に巨大太陽弾が撃たれたか検知
      const oldLen = enemyBullets.length;
      enemyBullets.push(...boss.fire(timestamp, px, py));
      const newLen = enemyBullets.length;
      
      // 新しい太陽弾が撃ち出されたらズシーンと画面を揺らす！
      let hasSolarShot = false;
      for (let idx = oldLen; idx < newLen; idx++) {
        if (enemyBullets[idx] && enemyBullets[idx].isSolar) {
          hasSolarShot = true;
          break;
        }
      }
      if (hasSolarShot) {
        triggerShake(10, 4.5); // 太陽射出時の重低音振動エフェクト
      }
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

    // 3. 自機弾の移動とボスとの【当たり判定】 (境界値を PLAY_WIDTH に)
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

      if (b.isOutOfBounds(PLAY_WIDTH, PLAY_HEIGHT)) {
        bullets.splice(i, 1);
      }
    }

    // 4. 敵弾の移動と自機への【被弾・グレイズ判定】 (境界値を PLAY_WIDTH に)
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
        triggerShake(24, 14); // 被弾時の激しい画面シェイク！
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

      if (eb.isOutOfBounds(PLAY_WIDTH, PLAY_HEIGHT)) {
        enemyBullets.splice(i, 1);
      }
    }

    // ★追加：CAUTIONタイマーの各節目で画面振動を発生させる (3段アラームの原作演出再現)
    if (cautionTimer === 135) triggerShake(15, 6.0); // 1回目のアラーム振動
    if (cautionTimer === 85) triggerShake(15, 6.0);  // 2回目のアラーム振動
    if (cautionTimer === 35) triggerShake(25, 9.0);  // 3回目の弾幕発射開始の本震
  } else {
    // FAILED または CAPTURED 時は delta time 計算用の基準時刻をリセット
    lastTime = 0;
  }

  // --- 描画処理（全ステート共通） ---
  
  // 自機弾の描画 (プレイ領域のみクリップして描画することでサイドバーにはみ出さないようにする)
  ctx.save();
  ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
  ctx.clip();
  
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
  ctx.restore();
  
  // 仮想パッドの描画
  input.draw();

  // --- 被弾時の赤フラッシュエフェクト (プレイ領域のみに適用) ---
  if (flashTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.4 * (flashTimer / 15)})`;
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.restore();
    flashTimer--;
  }

  // --- ☢ CAUTION ☢ 警告演出 (お空戦名物、核融合炉警報 - プレイ領域のみにクリップ) ---
  if (cautionTimer > 0 && gameState === 'PLAYING') {
    ctx.save();
    ctx.rect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
    ctx.clip();
    const bandHeight = 75;
    const bandY = canvas.height * 0.42 - bandHeight / 2;
    
    // 背景のダークレッド透過帯
    ctx.fillStyle = 'rgba(20, 0, 0, 0.72)';
    ctx.fillRect(0, bandY - 12, PLAY_WIDTH, bandHeight + 24);
    
    // 上下の黄色と黒の警戒縞
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(PLAY_WIDTH, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(PLAY_WIDTH, bandY + bandHeight + 12);
    ctx.stroke();

    // 縞模様を破線で表現して警告らしさをアップ
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(0, bandY - 12);
    ctx.lineTo(PLAY_WIDTH, bandY - 12);
    ctx.moveTo(0, bandY + bandHeight + 12);
    ctx.lineTo(PLAY_WIDTH, bandY + bandHeight + 12);
    ctx.stroke();
    
    // 赤いCAUTIONの高速点滅
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

  // --- プレイ画面(左側 360px)の飾り枠（原作のアーケード筐体風、ゴールド×深紅 of 二重枠） ---
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // ゴールドの細い外枠
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, PLAY_WIDTH - 10, PLAY_HEIGHT - 10);
  
  ctx.strokeStyle = 'rgba(139, 0, 0, 0.55)'; // 深紅のさらに細い内枠
  ctx.lineWidth = 1.5;
  ctx.strokeRect(9, 9, PLAY_WIDTH - 18, PLAY_HEIGHT - 18);
  ctx.restore();

  // ==========================================
  // ★原作完全再現：縦型ステータスサイドバーHUD描画（右側 120px）
  // ==========================================
  ctx.save();
  // 1. サイドバー全体の暗い背景板
  ctx.fillStyle = '#121214'; // 重厚感のあるダークグレー
  ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, GAME_HEIGHT);

  // 2. プレイ領域とサイドバーを仕切る金・深紅の金属製境界スリット
  ctx.strokeStyle = '#d4af37'; // ゴールド主枠
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_X, 0);
  ctx.lineTo(SIDEBAR_X, GAME_HEIGHT);
  ctx.stroke();

  ctx.strokeStyle = '#220000'; // 境界シャドウ
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_X - 3, 0);
  ctx.lineTo(SIDEBAR_X - 3, GAME_HEIGHT);
  ctx.stroke();

  // 3. テキスト影効果（原作ステータス画面特有の立体感）
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1.2;
  ctx.shadowOffsetY = 1.2;

  const hx = SIDEBAR_X + 15; // テキスト開始基準X座標 (375px)

  // A. モードタイトル
  ctx.font = 'bold 9px "Georgia", serif';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'left';
  ctx.fillText('SPELL PRACTICE', hx, 30);

  // B. HI-SCORE
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d'; // 原作風チェリーレッド
  ctx.fillText('Hi-Score', hx, 65);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('999999990', hx, 82);

  // C. SCORE
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Score', hx, 115);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(playerScore.toString().padStart(9, '0'), hx, 132);

  // D. PLAYER (残機★)
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Player', hx, 175);
  
  ctx.font = 'bold 14px "Georgia", "Arial", sans-serif';
  ctx.fillStyle = '#ff4d4d'; // 赤い星マーク
  ctx.fillText('★ ★ ★', hx, 192);

  // E. SPELL/BOMB (ボム★)
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Spell', hx, 225);
  
  ctx.font = 'bold 14px "Georgia", "Arial", sans-serif';
  ctx.fillStyle = '#4dff4d'; // 緑の星マーク
  ctx.fillText('★ ★ ★', hx, 242);

  // F. POWER
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#ff4d4d';
  ctx.fillText('Power', hx, 285);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('4.00 / 4.00', hx, 302);

  // G. GRAZE (原作準拠の鮮やかな緑ラベル)
  ctx.font = 'bold 11px "Georgia", serif';
  ctx.fillStyle = '#4dff4d'; 
  ctx.fillText('Graze', hx, 345);
  
  ctx.font = 'bold 13px "Georgia", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(player.graze.toString().padStart(5, '0'), hx, 362);

  // H. SPELL BONUS (減少するゴールドラベル、戦闘中のみ表示)
  if (boss.isAlive && gameState === 'PLAYING') {
    ctx.font = 'italic bold 11px "Georgia", serif';
    ctx.fillStyle = '#ffaa00'; 
    ctx.fillText('Spell Bonus', hx, 415);
    
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.floor(spellBonus).toString().padStart(8, '0'), hx, 432);
  }
  ctx.restore();

  // ==========================================
  // ★アクションエリア上（Play Area内）のオーバーレイ要素
  // ==========================================
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;

  // I. 残り時間タイマー (Play Areaの右上)
  ctx.font = 'bold 34px "Georgia", serif';
  ctx.fillStyle = spellTimer <= 10 ? '#ff4d4d' : '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(spellTimer).toString().padStart(2, '0'), PLAY_WIDTH - 15, 55);

  // J. スペルカード名（Play Areaの右下、斜体風描画）
  if (boss.isAlive) {
    ctx.font = 'italic 12px "Georgia", "Hiragino Kaku Gothic Pro", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'right';
    ctx.fillText(boss.spellName, PLAY_WIDTH - 15, PLAY_HEIGHT - 25);
  }
  ctx.restore();

  // ★追加：シェイク状態から復帰させるためのリストア
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// 最初のループ起動
requestAnimationFrame(gameLoop);
