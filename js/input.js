// js/input.js
export class InputManager {
  constructor(controlPad, joyCanvas) {
    this.controlPad = controlPad;
    this.joyCanvas = joyCanvas;
    this.joyCtx = joyCanvas.getContext('2d');
    
    this.isSlowMode = false;
    this.moveDirX = 0;
    this.moveDirY = 0;
    
    // ジョイスティック内部状態
    this.isJoyActive = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.maxRadius = 50;
    
    // ★追加：ジョイスティックを操作している「指のID」を記憶する
    this.joyTouchId = null; 

    this._initEvents();
  }

  _initEvents() {
    const slowBtn = document.getElementById('slowButton');
    
    // --- 低速ボタンの処理 ---
    const setSlow = (e, val) => {
      if (e) {
        if (e.type !== 'keydown' && e.type !== 'keyup') {
          e.preventDefault(); 
          e.stopPropagation(); // ★重要：ボタンへのタッチがジョイスティック側に誤爆するのを防ぐ
        }
      }
      this.isSlowMode = val;
      val ? slowBtn.classList.add('active') : slowBtn.classList.remove('active');
    };

    // マウス用のイベント
    slowBtn.addEventListener('mousedown', (e) => setSlow(e, true));
    slowBtn.addEventListener('mouseup', (e) => setSlow(e, false));
    slowBtn.addEventListener('mouseleave', (e) => setSlow(e, false));
    // ★追加：スマホ用のタッチイベント
    slowBtn.addEventListener('touchstart', (e) => setSlow(e, true), { passive: false });
    slowBtn.addEventListener('touchend', (e) => setSlow(e, false));
    slowBtn.addEventListener('touchcancel', (e) => setSlow(e, false));

    // PC用のキーボードイベント
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift') setSlow(e, true); });
    window.addEventListener('keyup', (e) => { if (e.key === 'Shift') setSlow(e, false); });

    // --- ジョイスティックの処理（マルチタッチ対応） ---
    const setJoyStart = (e) => {
      if (e.type !== 'mousedown') e.preventDefault();
      if (this.isJoyActive) return; // すでに操作中なら無視

      let point;
      if (e.type === 'touchstart') {
        point = e.changedTouches[0];
        this.joyTouchId = point.identifier; // ★操作を始めた指のIDを記憶
      } else {
        point = e;
        this.joyTouchId = 'mouse';
      }

      this.isJoyActive = true;
      const rect = this.controlPad.getBoundingClientRect();
      this.startX = point.clientX - rect.left;
      this.startY = point.clientY - rect.top;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this._calcDir();
    };

    const setJoyMove = (e) => {
      if (!this.isJoyActive) return;
      if (e.type !== 'mousemove') e.preventDefault();

      let point;
      if (e.type === 'touchmove') {
        // ★動いた指の中に、ジョイスティックを操作中の指(joyTouchId)があるか探す
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joyTouchId) {
            point = e.changedTouches[i];
            break;
          }
        }
        if (!point) return; // 別の指（低速ボタンなど）が動いただけなら無視する
      } else {
        point = e;
      }

      const rect = this.controlPad.getBoundingClientRect();
      this.currentX = point.clientX - rect.left;
      this.currentY = point.clientY - rect.top;
      this._calcDir();
    };

    const setJoyEnd = (e) => {
      if (!this.isJoyActive) return;

      // ★離れた指が、ジョイスティックを操作中の指だった場合のみリセットする
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
      this.moveDirX = 0;
      this.moveDirY = 0;
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

  // --- 入力角度の計算（変更なし） ---
  _calcDir() {
    const dx = this.currentX - this.startX;
    const dy = this.currentY - this.startY;
    const dist = Math.hypot(dx, dy);
    if (dist < 15) {
      this.moveDirX = 0; this.moveDirY = 0; return;
    }
    const angle = Math.atan2(dy, dx);
    let deg = angle * (180 / Math.PI);
    if (deg < 0) deg += 360;
    const snapDeg = Math.round(deg / 45) * 45;
    const snapRad = snapDeg * (Math.PI / 180);
    this.moveDirX = Math.cos(snapRad);
    this.moveDirY = Math.sin(snapRad);
  }

  // --- ジョイスティックの描画（変更なし） ---
  draw() {
    this.joyCtx.clearRect(0, 0, this.joyCanvas.width, this.joyCanvas.height);
    if (this.isJoyActive) {
      this.joyCtx.beginPath();
      this.joyCtx.arc(this.startX, this.startY, this.maxRadius, 0, Math.PI * 2);
      this.joyCtx.fillStyle = 'rgba(255,255,255,0.1)';
      this.joyCtx.fill();
      this.joyCtx.strokeStyle = 'rgba(255,255,255,0.3)';
      this.joyCtx.stroke();
      
      const drawX = this.startX + this.moveDirX * this.maxRadius;
      const drawY = this.startY + this.moveDirY * this.maxRadius;
      this.joyCtx.beginPath();
      this.joyCtx.arc(drawX, drawY, 20, 0, Math.PI * 2);
      this.joyCtx.fillStyle = 'rgba(255,255,255,0.5)';
      this.joyCtx.fill();
    }
  }
}