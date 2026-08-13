// js/main.js

import { InputManager } from './input.js';
import { Player } from './player.js';
// ★変更：Enemy ではなく Boss をインポート
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
  // ※ gameCanvas の width/height は固定したため、ここでは変更しない
  
  // 操作パッド用のCanvas（joyCanvas）は画面サイズに合わせる
  joyCanvas.width = controlPad.clientWidth; 
  joyCanvas.height = controlPad.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 画像の読み込み ---
const playerImg = new Image(); playerImg.src = 'assets/player.png';
const bulletImg = new Image(); bulletImg.src = 'assets/bullet.png';
const bossImg = new Image(); bossImg.src = 'assets/enemy.png'; // ボス用画像（とりあえず用意した敵画像を使用）

// --- インスタンスの生成 ---
const input = new InputManager(controlPad, joyCanvas);
const player = new Player(canvas.width / 2, canvas.height * 0.8, playerImg, bulletImg);

// ★追加：ボスの生成
// x, y, width, height, hp, image, canvasWidth
// 初期位置のYを -100 にして、画面外の上から降りてくる演出にします
// サイズを 80x80 と少し大きめにし、HPを 100 に設定します
let boss = new Boss(canvas.width / 2 - 40, -100, 80, 80, 100, bossImg, canvas.width);

let bullets = []; 
let enemyBullets = [];

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  // 3. 弾の移動とボスとの【当たり判定】
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.update();

    let hit = false;

    // ★変更：ボス1体だけとの当たり判定をチェック
    if (boss.isAlive && checkCollision(b, boss)) {
      boss.takeDamage(1); // ボスに1ダメージ
      hit = true;
    }

    if (hit) {
      bullets.splice(i, 1); // 当たった弾は消す
      continue;
    }

    if (b.isOutOfBounds(canvas.width, canvas.height)) {
      bullets.splice(i, 1);
    } else {
      b.draw(ctx);
    }
  }
 // ==========================================
  // ★追加：4. 敵弾の移動と自機への【被弾・グレイズ判定】
  // ==========================================
  const px = player.x + player.width / 2; // 自機の中心X
  const py = player.y + player.height / 2; // 自機の中心Y

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let eb = enemyBullets[i];
    eb.update();

    // 敵弾の中心座標と半径
    const bx = eb.x + eb.width / 2;
    const by = eb.y + eb.height / 2;
    const bulletRadius = eb.width / 2; // 今回は10

    // ピタゴラスの定理で「自機と敵弾の中心距離」を計算
    const dist = Math.hypot(bx - px, by - py);

    // ① 被弾判定（距離が お互いの半径の合計 より小さいか）
    if (dist < player.hitboxRadius + bulletRadius) {
      // 本来はここでミス（残機減）処理
      console.log("HIT!"); // 今回はとりあえずログだけ
      enemyBullets.splice(i, 1); // 当たった弾は消える
      continue;
    }

    // ② グレイズ判定（被弾はしてないが、グレイズ半径には入ったか）
    if (!eb.isGrazed && dist < player.grazeRadius + bulletRadius) {
      eb.isGrazed = true; // この弾でのグレイズは完了
      player.graze++;     // グレイズスコアを+1
    }

    // 画面外処理と描画
    if (eb.isOutOfBounds(canvas.width, canvas.height)) {
      enemyBullets.splice(i, 1);
    } else {
      eb.draw(ctx);
    }
  }

  // 5. 描画
  if (boss.isAlive) {
    boss.draw(ctx);
  } else {
    // ... クリア表示 ...
  }

  player.draw(ctx, input);
  input.draw();

  // ★追加：画面左上にグレイズ数を表示するUI
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`GRAZE: ${player.graze}`, 10, 30);

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);