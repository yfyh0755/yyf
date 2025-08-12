/*
  学霸俄罗斯方块：期末不挂科版
  - 经典方块玩法
  - 精力值、考试倒计时
  - 道具：肥宅快乐水、学霸笔记、偷看答案
  - 突发事件：校园广播、同桌捣乱
  - 搞笑文案与对话
*/

(function(){
  'use strict';

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const energyBar = document.getElementById('energy-bar');
  const timerBar = document.getElementById('timer-bar');
  const eventLog = document.getElementById('event-log');
  const overlay = document.getElementById('overlay');
  const pauseMask = document.getElementById('pause-mask');

  const dialog = document.getElementById('dialog');
  const dialogText = document.getElementById('dialog-text');
  const dialogOk = document.getElementById('dialog-ok');

  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnRotate = document.getElementById('btn-rotate');
  const btnDrop = document.getElementById('btn-drop');
  const btnCola = document.getElementById('btn-cola');
  const btnNotes = document.getElementById('btn-notes');
  const btnCheat = document.getElementById('btn-cheat');

  const toasts = document.getElementById('toasts');

  // Board config
  const COLS = 10; // standard tetris width
  const ROWS = 20; // standard tetris height
  const CELL = canvas.width / COLS; // 36px

  // Game state
  const initialEnergy = 100;
  const initialTime = 120; // seconds for exam timer

  const themes = {
    // colors also imply "subject" for fun
    I: {color: '#60a5fa', label: '英语单词长龙'},
    O: {color: '#fbbf24', label: '化学元素'},
    T: {color: '#a78bfa', label: '历史事件时间线'},
    S: {color: '#34d399', label: '物理实验现象'},
    Z: {color: '#fb7185', label: '政治选择题'},
    J: {color: '#f472b6', label: '古诗词名句'},
    L: {color: '#22d3ee', label: '数学公式'},
  };

  const tetrominoes = {
    I: [ [1,1,1,1] ],
    O: [ [1,1],[1,1] ],
    T: [ [0,1,0],[1,1,1] ],
    S: [ [0,1,1],[1,1,0] ],
    Z: [ [1,1,0],[0,1,1] ],
    J: [ [1,0,0],[1,1,1] ],
    L: [ [0,0,1],[1,1,1] ],
  };

  const knowledgeTexts = {
    I: ['apple','banana','hello','world','exam','review','perfect','score'],
    O: ['He','Ne','Ar','Kr','Xe','Rn'],
    T: ['戊戌','辛亥','新政','北伐','改土归流'],
    S: ['电磁感应','干涉','衍射','布朗运动'],
    Z: ['单选','多选','判断','材料题'],
    J: ['春眠不觉晓','海内存知己','但愿人长久'],
    L: ['∫x²dx','lim→∞','Δy/Δx','sin²x+cos²x=1'],
  };

  const funnyNPC = {
    fail: '监考老师：同学，你这道题没解开，下学期再来吧。',
    combo: '班主任：不错，悟性很高！下个学期继续努力。',
  };

  const toolsText = {
    cola: '肥宅快乐水：+30精力，10秒内方块下落速度翻倍！',
    notes: '学霸笔记：直接清除最满的一行！',
    cheat: '偷看答案：冻结所有方块 5 秒！',
  };

  const eventsText = {
    broadcast: '校园广播：洗脑神曲来袭，注意力-10%',
    disturb: '同桌捣乱：屏幕飘来遮挡物，小心挡视线',
  };

  function createMatrix(w, h, fill = 0){
    const m = [];
    for(let y=0;y<h;y++){
      const row = new Array(w).fill(fill);
      m.push(row);
    }
    return m;
  }

  function rotate(matrix){
    // 获取原始矩阵的行数和列数
    const oldCols = matrix[0].length;
    const oldRows = matrix.length;
    
    // 创建一个新矩阵，新矩阵的行数等于旧矩阵的列数，新矩阵的列数等于旧矩阵的行数
    const rotatedMatrix = createMatrix(oldRows, oldCols, 0);

    // 遍历原始矩阵，将元素转置到新矩阵中
    for (let y = 0; y < oldRows; y++) {
      for (let x = 0; x < oldCols; x++) {
        rotatedMatrix[x][oldRows - 1 - y] = matrix[y][x];
      }
    }
    return rotatedMatrix;
  }

  function randomKey(){
    const keys = Object.keys(tetrominoes);
    return keys[Math.floor(Math.random()*keys.length)];
  }

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function toast(message, type = 'good'){
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = message;
    toasts.appendChild(div);
    setTimeout(()=>{
      div.remove();
    }, 2200);
  }

  function logEvent(text){
    const li = document.createElement('li');
    li.textContent = text;
    eventLog.prepend(li);
    // keep last 20
    while(eventLog.children.length > 20){
      eventLog.removeChild(eventLog.lastChild);
    }
  }

  function showDialog(text){
    dialogText.textContent = text;
    dialog.classList.remove('hidden');
    return new Promise(resolve => {
      function close(){
        dialog.classList.add('hidden');
        dialogOk.removeEventListener('click', close);
        resolve();
      }
      dialogOk.addEventListener('click', close);
    });
  }

  // Piece factory
  function createPiece(){
    const key = randomKey();
    const shape = tetrominoes[key];
    return {
      key,
      shape: clone(shape),
      x: Math.floor((COLS - shape[0].length)/2),
      y: -2,
    };
  }

  // Game object
  const game = {
    board: createMatrix(COLS, ROWS, 0),
    piece: null,
    next: createPiece(),
    score: 0,
    lines: 0,
    level: 1,
    energy: initialEnergy,
    timeLeft: initialTime,
    isRunning: false,
    isPaused: false,
    speedMs: 800,
    tickId: null,
    speedBoostUntil: 0,
    frozenUntil: 0,
    disturbUntil: 0,
  };

  function reset(){
    game.board = createMatrix(COLS, ROWS, 0);
    game.piece = createPiece();
    game.next = createPiece();
    game.score = 0;
    game.lines = 0;
    game.level = 1;
    game.energy = initialEnergy;
    game.timeLeft = initialTime;
    game.speedMs = 800;
    game.speedBoostUntil = 0;
    game.frozenUntil = 0;
    game.disturbUntil = 0;
  }

  function collide(board, piece){
    const {shape, x: px, y: py} = piece;
    for(let y=0;y<shape.length;y++){
      for(let x=0;x<shape[y].length;x++){
        if(shape[y][x]){
          const nx = px + x;
          const ny = py + y;
          if(ny < 0) continue;
          if(nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if(board[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  function merge(board, piece){
    const {shape, x: px, y: py, key} = piece;
    for(let y=0;y<shape.length;y++){
      for(let x=0;x<shape[y].length;x++){
        if(shape[y][x]){
          const ny = py + y;
          if(ny < 0) continue;
          board[ny][px + x] = key; // store tetromino key
        }
      }
    }
  }

  function clearLines(lastPlacedKey){
    let cleared = 0;
    const newBoard = [];
    for(let y=0;y<ROWS;y++){
      const full = game.board[y].every(cell => cell !== 0);
      if(full){
        cleared++;
      }else{
        newBoard.push(game.board[y]);
      }
    }
    while(newBoard.length < ROWS){
      newBoard.unshift(new Array(COLS).fill(0));
    }
    game.board = newBoard;

    if(cleared > 0){
      const base = [0, 100, 300, 500, 800][cleared] || cleared*300;
      game.score += base * game.level;
      game.lines += cleared;
      if(cleared >= 2){
        // 顿悟时刻：清除同色（同 Key）方块
        let removed = 0;
        for(let y=0;y<ROWS;y++){
          for(let x=0;x<COLS;x++){
            if(game.board[y][x] === lastPlacedKey){
              game.board[y][x] = 0;
              removed++;
            }
          }
        }
        if(removed>0){
          toast(`顿悟时刻：清除了同色方块 x${removed}`,'good');
          game.score += removed * 5 * game.level;
        } else {
          toast('顿悟时刻：知识点串联，奖励加成！','good');
        }
      }
      // small chance to leave a wrong-question block
      if(Math.random() < 0.2){
        spawnWrongQuestion();
      }

      // level up gradually
      const newLevel = 1 + Math.floor(game.lines / 10);
      if(newLevel !== game.level){
        game.level = newLevel;
        game.speedMs = Math.max(120, 800 - (game.level-1)*60);
        toast(`等级提升至 ${game.level}，复习提速！`,'good');
      }

      // NPC praise on combos
      if(cleared >= 3){
        logEvent(funnyNPC.combo);
      }
      
      // 消除行后检查游戏是否应该结束
      checkGameOver();
    }
  }

  function spawnWrongQuestion(){
    // place a random single cell that blocks
    for(let tries=0; tries<30; tries++){
      const x = Math.floor(Math.random()*COLS);
      const y = Math.floor(Math.random()*ROWS);
      if(game.board[y][x] === 0){
        game.board[y][x] = 'X'; // special wrong tile
        logEvent('搞笑反转：留下一个“错题”方块，需用道具处理');
        break;
      }
    }
  }

  function removeOneMostFilledRow(){
    let bestY = -1;
    let bestCount = -1;
    for(let y=0;y<ROWS;y++){
      const count = game.board[y].filter(Boolean).length;
      if(count > bestCount){
        bestCount = count; bestY = y;
      }
    }
    if(bestY >= 0){
      game.board.splice(bestY,1);
      game.board.unshift(new Array(COLS).fill(0));
    }
  }

  function drawCell(x, y, key){
    const px = x * CELL;
    const py = y * CELL;

    const color = key === 'X' ? '#ef4444' : (themes[key]?.color || '#9ca3af');
    ctx.fillStyle = color;
    ctx.fillRect(px+1, py+1, CELL-2, CELL-2);

    // knowledge text watermark - use stable text based on position and time
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.font = 'bold 10px "Noto Sans SC"';
    
    let label;
    if(key === 'X'){
      label = '错题';
    } else {
      // Use position + time to create stable text that changes every 3 seconds
      const timeSlot = Math.floor(Date.now() / 3000); // 3 seconds
      const textIndex = (x + y + timeSlot) % (knowledgeTexts[key] || ['知识']).length;
      label = (knowledgeTexts[key] || ['知识'])[textIndex];
    }
    
    ctx.fillText(label, px+4, py+12);
    ctx.restore();

    // edge
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.strokeRect(px+0.5, py+0.5, CELL-1, CELL-1);
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // board
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const cell = game.board[y][x];
        if(cell){ drawCell(x,y,cell); }
      }
    }

    // current piece
    if(game.piece){
      const {shape, x: px, y: py, key} = game.piece;
      for(let y=0;y<shape.length;y++){
        for(let x=0;x<shape[y].length;x++){
          if(shape[y][x]){
            const by = py + y;
            if(by >= 0){
              drawCell(px+x, by, key);
            }
          }
        }
      }
    }

    // disturb overlay
    if(Date.now() < game.disturbUntil){
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      for(let i=0;i<8;i++){
        const r = Math.random()*40+20;
        ctx.beginPath();
        ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawNext(){
    nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
    const piece = game.next;
    const {shape, key} = piece;
    const cw = shape[0].length;
    const ch = shape.length;
    const size = 24;
    const ox = Math.floor((nextCanvas.width - cw*size)/2);
    const oy = Math.floor((nextCanvas.height - ch*size)/2);
    nextCtx.strokeStyle = 'rgba(255,255,255,.15)';
    for(let y=0;y<ch;y++){
      for(let x=0;x<cw;x++){
        if(shape[y][x]){
          nextCtx.fillStyle = themes[key].color;
          nextCtx.fillRect(ox+x*size+1, oy+y*size+1, size-2, size-2);
          nextCtx.strokeRect(ox+x*size+0.5, oy+y*size+0.5, size-1, size-1);
        }
      }
    }
  }

  function updateBars(){
    energyBar.style.width = Math.max(0, Math.min(100, game.energy)) + '%';
    timerBar.style.width = Math.max(0, Math.min(100, (game.timeLeft/initialTime)*100)) + '%';
    scoreEl.textContent = String(game.score);
    linesEl.textContent = String(game.lines);
    levelEl.textContent = String(game.level);
  }

  function hardDrop(){
    if(!game.piece) return;
    let y = game.piece.y;
    while(true){
      game.piece.y++;
      if(collide(game.board, game.piece)){
        game.piece.y--;
        break;
      }
    }
    drop();
  }

  function softDrop(){
    if(Date.now() < game.frozenUntil) return; // frozen
    if(!game.piece) return;
    game.piece.y++;
    if(collide(game.board, game.piece)){
      game.piece.y--;
      drop();
    }
  }

  function move(dir){
    if(Date.now() < game.frozenUntil) return; // frozen
    if(!game.piece) return;
    game.piece.x += dir;
    if(collide(game.board, game.piece)){
      game.piece.x -= dir;
    }
  }

  function rotatePiece(){
    if(Date.now() < game.frozenUntil) return; // frozen
    if(!game.piece) return;
    
    const prevShape = clone(game.piece.shape);
    const prevX = game.piece.x;
    const prevY = game.piece.y;
    
    // 尝试旋转
    game.piece.shape = rotate(game.piece.shape);
    
    // 如果没有碰撞，则直接成功
    if(!collide(game.board, game.piece)) return;
    
    // Wall kick 偏移量：依次尝试右、左、上、下
    const offsets = [
        [1, 0],   // 右
        [-1, 0],  // 左
        [0, 1],   // 下
        [0, -1]   // 上
    ];
    
    for(const [ox, oy] of offsets){
      game.piece.x = prevX + ox;
      game.piece.y = prevY + oy;
      if(!collide(game.board, game.piece)){
        // 找到一个有效位置，旋转成功
        return;
      }
    }
    
    // 所有尝试都失败，恢复到旋转前的状态
    game.piece.x = prevX;
    game.piece.y = prevY;
    game.piece.shape = prevShape;
    return;
  }

  function drop(){
    const placedKey = game.piece.key;
    merge(game.board, game.piece);
    clearLines(placedKey);
    game.piece = game.next;
    game.piece.x = Math.floor((COLS - game.piece.shape[0].length)/2);
    game.piece.y = -2;
    game.next = createPiece();
    drawNext();

    // 检查新方块是否与已放置的方块碰撞（游戏结束条件）
    if(collide(game.board, game.piece)){
      endGame('大脑缓存溢出：知识点塞不下了！');
    }
  }

  // 检查游戏是否应该结束（方块堆积到顶部）
  function checkGameOver(){
    // 检查最顶部的几行是否有方块
    for(let y = 0; y < 2; y++){
      for(let x = 0; x < COLS; x++){
        if(game.board[y][x] !== 0){
          endGame('知识点堆积到顶：大脑过载，游戏结束！');
          return true;
        }
      }
    }
    return false;
  }

  function endGame(reason){
    game.isRunning = false;
    clearInterval(game.tickId);
    draw();
    updateBars();
    logEvent(funnyNPC.fail);
    showDialog(`${reason}\n\n${funnyNPC.fail}`);
  }

  function step(){
    if(!game.isRunning || game.isPaused) return;

    const now = Date.now();

    // 检查游戏是否应该结束（方块堆积到顶部）
    if(checkGameOver()) return;

    // energy decay
    game.energy -= 0.15; // per tick base
    if(game.energy <= 0){
      game.energy = 0;
      return endGame('精力值耗尽：复习过度，先休息一下吧。');
    }

    // time countdown
    game.timeLeft -= 1/ (1000/game.speedMs);
    if(game.timeLeft <= 0){
      game.timeLeft = 0;
      return endGame('考试时间到！交卷啦。');
    }

    // random events chance
    if(Math.random() < 0.02){ triggerEvent(); }

    // apply soft drop
    if(now < game.frozenUntil){
      // frozen: just draw bars and screen effects
    } else {
      softDrop();
    }

    draw();
    updateBars();
  }

  function triggerEvent(){
    const r = Math.random();
    if(r < 0.5){
      // broadcast
      logEvent(eventsText.broadcast);
      toast('校园广播响起：洗脑神曲干扰 + 节奏摇摆…','warn');
      // mimic distraction: small energy drop and minor speed variability
      game.energy = Math.max(0, game.energy - 5);
    } else {
      // desk mate disturb
      logEvent(eventsText.disturb);
      toast('同桌捣乱：屏幕漂浮遮挡 6 秒','warn');
      game.disturbUntil = Date.now() + 6000;
    }
  }

  // Tools
  function useCola(){
    toast(toolsText.cola, 'good');
    game.energy = Math.min(100, game.energy + 30);
    game.speedBoostUntil = Date.now() + 10000;
  }

  function useNotes(){
    toast(toolsText.notes, 'good');
    // 先移除错题 X
    let removedX = 0;
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(game.board[y][x] === 'X'){
          game.board[y][x] = 0;
          removedX++;
        }
      }
    }
    if(removedX>0){
      logEvent(`学霸笔记：清除了错题方块 x${removedX}`);
      game.score += removedX * 20;
    }
    removeOneMostFilledRow();
    draw();
  }

  function useCheat(){
    toast(toolsText.cheat, 'good');
    game.frozenUntil = Date.now() + 5000;
  }

  // Controls
  document.addEventListener('keydown', (e)=>{
    if(!game.isRunning) return;
    switch(e.key){
      case 'ArrowLeft': move(-1); break;
      case 'ArrowRight': move(1); break;
      case 'ArrowUp': rotatePiece(); e.preventDefault(); break;
      case 'ArrowDown': softDrop(); break;
      case ' ': hardDrop(); e.preventDefault(); break;
      case 'p': case 'P': togglePause(); break;
      case '1': useCola(); break;
      case '2': useNotes(); break;
      case '3': useCheat(); break;
    }
    draw();
  });

  btnLeft.addEventListener('click', ()=>{ move(-1); draw(); });
  btnRight.addEventListener('click', ()=>{ move(1); draw(); });
  btnRotate.addEventListener('click', ()=>{ rotatePiece(); draw(); });
  btnDrop.addEventListener('click', ()=>{ hardDrop(); draw(); });
  btnCola.addEventListener('click', useCola);
  btnNotes.addEventListener('click', useNotes);
  btnCheat.addEventListener('click', useCheat);

  function togglePause(){
    if(!game.isRunning) return;
    game.isPaused = !game.isPaused;
    pauseMask.classList.toggle('hidden', !game.isPaused);
  }

  btnPause.addEventListener('click', togglePause);

  btnStart.addEventListener('click', ()=>{
    reset();
    startGame();
  });

  function startGame(){
    game.isRunning = true;
    game.isPaused = false;
    pauseMask.classList.add('hidden');
    draw();
    drawNext();
    updateBars();
    dropAccumulator = 0;
    lastBeat = Date.now();
  }

  // Replace interval approach with heartbeat + accumulators for smoother speed changes
  let heartbeatId = null;
  let dropAccumulator = 0;
  const HEARTBEAT_MS = 100; // 10 fps logic
  let lastBeat = Date.now();
  const FULL_MARKS_LINES = 20; // 挑战模式目标

  function ensureHeartbeat(){
    if(heartbeatId) clearInterval(heartbeatId);
    heartbeatId = setInterval(()=>{
      const now = Date.now();
      const dtMs = now - lastBeat;
      lastBeat = now;

      if(!game.isRunning || game.isPaused){
        updateBars();
        return;
      }

      // continuous time & energy decay
      const dt = dtMs / 1000;
      game.timeLeft = Math.max(0, game.timeLeft - dt);
      game.energy = Math.max(0, game.energy - dt * 0.9);

      if(game.timeLeft === 0){
        if(game.lines >= FULL_MARKS_LINES){
          game.isRunning = false;
          updateBars();
          draw();
          showDialog(`时间到！你在规定时间内清除了 ${game.lines} 行，获得“全科满分”奖励！\n\n班主任：稳！下个学期继续保持。`);
        } else {
          endGame('考试时间到！交卷啦。');
        }
        return;
      }
      if(game.energy === 0){ endGame('精力值耗尽：复习过度，先休息一下吧。'); return; }

      const boosted = now < game.speedBoostUntil;
      const currentSpeed = Math.max(120, boosted ? game.speedMs/2 : game.speedMs);

      // dropping accumulator based on elapsed time
      dropAccumulator += dtMs;
      if(dropAccumulator >= currentSpeed){
        dropAccumulator = 0;
        step();
      } else {
        draw();
        updateBars();
      }
    }, HEARTBEAT_MS);
  }

  // initialize
  reset();
  draw();
  drawNext();
  updateBars();
  ensureHeartbeat();

  // Accessibility: focus canvas to enable keyboard on click
  canvas.addEventListener('click', ()=>canvas.focus());

})();


