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
  const newBullets = player.fire(timestamp, input);
  bullets.push(...newBullets);

  // 2. ボスの更新
  if (boss.isAlive) {
    boss.update();
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

  // 4. 描画
  if (boss.isAlive) {
    boss.draw(ctx);
  } else {
    // ボスが倒された時の仮のクリア表示
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE CLEAR!', canvas.width / 2, canvas.height / 2);
  }

  player.draw(ctx, input);
  input.draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);