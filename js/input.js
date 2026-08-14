// js/input.js
export class InputManager {
  constructor(controlPad, joyCanvas) {
    this.controlPad = controlPad;
    this.joyCanvas = joyCanvas;
    this.joyCtx = joyCanvas.getContext('2d');
    
    this.isSlowMode = false;
    
    // 相対ドラッグ操作用ステート
    this.isJoyActive = false;
    this.startX = 0;       // ドラッグ開始位置（ローカル座標）
    this.startY = 0;
    this.currentX = 0;     // 現在の位置（ローカル座標）
    this.currentY = 0;
    this.prevX = 0;        // 前フレームのタッチX（スクリーン座標 clientX）
    this.prevY = 0;        // 前フレームのタッチY（スクリーン座標 clientY）
    this.deltaX = 0;       // フレームごとの相対移動量
    this.deltaY = 0;
    
    this.joyTouchId = null; 

    // キーボード操作用の状態管理 (PC開発・テスト用)
    this.keys = {};

    this._initEvents();
  }

  _initEvents() {
    const slowBtn = document.getElementById('slowButton');
    
    // --- 低速ボタンの処理 ---
    const setSlow = (e, val) => {
      if (e) {
        if (e.type !== 'keydown' && e.type !== 'keyup') {
          e.preventDefault(); 
          e.stopPropagation(); // ボタンへのタッチがドラッグ操作に誤爆するのを防ぐ
        }
      }
      this.isSlowMode = val;
      val ? slowBtn.classList.add('active') : slowBtn.classList.remove('active');
    };

    // マウス用のイベント
    slowBtn.addEventListener('mousedown', (e) => setSlow(e, true));
    slowBtn.addEventListener('mouseup', (e) => setSlow(e, false));
    slowBtn.addEventListener('mouseleave', (e) => setSlow(e, false));
    
    // スマホ用のタッチイベント
    slowBtn.addEventListener('touchstart', (e) => setSlow(e, true), { passive: false });
    slowBtn.addEventListener('touchend', (e) => setSlow(e, false));
    slowBtn.addEventListener('touchcancel', (e) => setSlow(e, false));

    // PC用のキーボードイベント (Shiftキーでの低速切替)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        setSlow(e, true);
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        setSlow(e, false);
      }
      this.keys[e.code] = false;
    });

    // --- 相対ドラッグ処理 ---
    const setJoyStart = (e) => {
      if (e.type !== 'mousedown') e.preventDefault();
      if (this.isJoyActive) return; // すでに操作中なら無視

      let point;
      if (e.type === 'touchstart') {
        point = e.changedTouches[0];
        this.joyTouchId = point.identifier; // 操作を始めた指のIDを記憶
      } else {
        point = e;
        this.joyTouchId = 'mouse';
      }

      this.isJoyActive = true;
      const rect = this.controlPad.getBoundingClientRect();
      
      // 開始ローカル座標を記録
      this.startX = point.clientX - rect.left;
      this.startY = point.clientY - rect.top;
      this.currentX = this.startX;
      this.currentY = this.startY;
      
      // 相対移動計算用の基準点（スクリーン座標）
      this.prevX = point.clientX;
      this.prevY = point.clientY;
      
      this.deltaX = 0;
      this.deltaY = 0;
    };

    const setJoyMove = (e) => {
      if (!this.isJoyActive) return;
      if (e.type !== 'mousemove') e.preventDefault();

      let point;
      if (e.type === 'touchmove') {
        // 操作中の指を探す
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joyTouchId) {
            point = e.changedTouches[i];
            break;
          }
        }
        if (!point) return;
      } else {
        point = e;
      }

      const rect = this.controlPad.getBoundingClientRect();
      this.currentX = point.clientX - rect.left;
      this.currentY = point.clientY - rect.top;

      // 前フレームからの移動量を計算して累積
      this.deltaX += point.clientX - this.prevX;
      this.deltaY += point.clientY - this.prevY;

      // 基準点を更新
      this.prevX = point.clientX;
      this.prevY = point.clientY;
    };

    const setJoyEnd = (e) => {
      if (!this.isJoyActive) return;

      if (e && (e.type === 'touchend' || e.type === 'touchcancel')) {
        let isJoyFingerLifted = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joyTouchId) {
            isJoyFingerLifted = true;
            break;
          }
        }
        if (!isJoyFingerLifted) return;
      }

      this.isJoyActive = false;
      this.joyTouchId = null;
      this.deltaX = 0;
      this.deltaY = 0;
    };

    // イベントリスナーの登録（ウィンドウ全体へのタッチ移動も監視する）
    this.controlPad.addEventListener('mousedown', setJoyStart);
    window.addEventListener('mousemove', setJoyMove);
    window.addEventListener('mouseup', setJoyEnd);

    this.controlPad.addEventListener('touchstart', setJoyStart, { passive: false });
    window.addEventListener('touchmove', setJoyMove, { passive: false });
    window.addEventListener('touchend', setJoyEnd);
    window.addEventListener('touchcancel', setJoyEnd);
  }

  // --- PCキーボード移動の処理（毎フレームゲームループで更新） ---
  update() {
    let kx = 0;
    let ky = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) kx = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) kx = 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) ky = -1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) ky = 1;

    if (kx !== 0 && ky !== 0) {
      // 斜め移動の正規化
      const len = Math.hypot(kx, ky);
      kx /= len;
      ky /= len;
    }

    // キーボードの基準速度（1フレームの移動ピクセル数）
    const baseSpeed = this.isSlowMode ? 2 : 5;
    const sensitivity = this.isSlowMode ? 0.5 : 1.2;

    if (kx !== 0) {
      this.deltaX = (kx * baseSpeed) / sensitivity;
    }
    if (ky !== 0) {
      this.deltaY = (ky * baseSpeed) / sensitivity;
    }
  }

  // --- 相対ドラッグ操作の可視化 ---
  draw() {
    this.joyCtx.clearRect(0, 0, this.joyCanvas.width, this.joyCanvas.height);
    if (this.isJoyActive) {
      // 1. ドラッグ開始地点（基準点）を描画
      this.joyCtx.beginPath();
      this.joyCtx.arc(this.startX, this.startY, 35, 0, Math.PI * 2);
      this.joyCtx.fillStyle = 'rgba(255,255,255,0.08)';
      this.joyCtx.fill();
      this.joyCtx.strokeStyle = 'rgba(255,255,255,0.2)';
      this.joyCtx.lineWidth = 1.5;
      this.joyCtx.stroke();
      
      // 2. 指の現在位置を描画
      this.joyCtx.beginPath();
      this.joyCtx.arc(this.currentX, this.currentY, 15, 0, Math.PI * 2);
      this.joyCtx.fillStyle = 'rgba(255,255,255,0.4)';
      this.joyCtx.fill();
      
      // 3. 基準点と現在位置を繋ぐ細いガイドラインを描画
      this.joyCtx.beginPath();
      this.joyCtx.moveTo(this.startX, this.startY);
      this.joyCtx.lineTo(this.currentX, this.currentY);
      this.joyCtx.strokeStyle = 'rgba(255,255,255,0.15)';
      this.joyCtx.lineWidth = 1;
      this.joyCtx.stroke();
    }
  }
}
