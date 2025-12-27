// Game configuration - Fixed 9x9 board with 10 mines
var ROWS = 9;
var COLS = 9;
var MINES = 10;

var gameBoard = [];
var revealed = new CustomSet();
var flagged = new CustomSet();
var gameOver = false;
var gameWon = false;
var firstClick = true;
var timerInterval = null;
var seconds = 0;
var moves = 0;

// Initialize game
function init() {
  gameBoard = createBoard(ROWS, COLS, MINES);
  revealed = new CustomSet();
  flagged = new CustomSet();
  gameOver = false;
  gameWon = false;
  firstClick = true;
  seconds = 0;
  moves = 0;
  clearInterval(timerInterval);
  updateTimer();
  updateMineCount();
  updateScore();
  renderBoard();
  updateMessage('');
}

// Create board with mines
function createBoard(rows, cols, mineCount) {
  var newBoard = [];
  for (var i = 0; i < rows; i++) {
    newBoard[i] = [];
    for (var j = 0; j < cols; j++) {
      newBoard[i][j] = { mine: false, count: 0 };
    }
  }

  // Place mines randomly
  var minesPlaced = 0;
  while (minesPlaced < mineCount) {
    var row = Math.floor(Math.random() * rows);
    var col = Math.floor(Math.random() * cols);
    if (!newBoard[row][col].mine) {
      newBoard[row][col].mine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mine counts
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      if (!newBoard[i][j].mine) {
        newBoard[i][j].count = countAdjacentMines(newBoard, i, j, rows, cols);
      }
    }
  }

  return newBoard;
}

// Count adjacent mines
function countAdjacentMines(grid, row, col, rows, cols) {
  var count = 0;
  var directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (var i = 0; i < directions.length; i++) {
    var newRow = row + directions[i][0];
    var newCol = col + directions[i][1];
    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      if (grid[newRow][newCol].mine) count++;
    }
  }
  return count;
}

// Render board
function renderBoard() {
  var boardElement = document.getElementById('board');
  boardElement.innerHTML = '';

  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;

      var key = i + '-' + j;
      if (revealed.has(key)) {
        cell.classList.add('revealed');
        if (gameBoard[i][j].mine) {
          cell.classList.add('mine');
        } else if (gameBoard[i][j].count > 0) {
          cell.textContent = gameBoard[i][j].count;
          cell.dataset.count = gameBoard[i][j].count;
        }
      } else if (flagged.has(key)) {
        cell.classList.add('flagged');
      }

      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleRightClick);
      boardElement.appendChild(cell);
    }
  }
}

// Handle cell click
function handleCellClick(e) {
  if (gameOver || gameWon) return;

  var row = parseInt(e.target.dataset.row);
  var col = parseInt(e.target.dataset.col);
  var key = row + '-' + col;

  if (revealed.has(key) || flagged.has(key)) return;

  moves++;
  updateScore();

  if (firstClick) {
    firstClick = false;
    startTimer();
  }

  if (gameBoard[row][col].mine) {
    gameOver = true;
    revealAllMines();
    updateMessage('Game Over!');
    clearInterval(timerInterval);
  } else {
    revealCell(row, col);
    checkWin();
  }

  renderBoard();
}

// Handle right click for flagging
function handleRightClick(e) {
  e.preventDefault();
  if (gameOver || gameWon) return;

  var row = parseInt(e.target.dataset.row);
  var col = parseInt(e.target.dataset.col);
  var key = row + '-' + col;

  if (revealed.has(key)) return;

  if (flagged.has(key)) {
    flagged.delete(key);
  } else {
    flagged.add(key);
  }

  updateMineCount();
  renderBoard();
}

// Reveal cell using BFS
function revealCell(row, col) {
  var queue = new Queue();
  var visited = new CustomSet();
  var startKey = row + '-' + col;

  queue.enqueue({ row: row, col: col });
  visited.add(startKey);

  while (!queue.isEmpty()) {
    var current = queue.dequeue();
    var r = current.row;
    var c = current.col;
    var currentKey = r + '-' + c;

    revealed.add(currentKey);

    if (gameBoard[r][c].count === 0) {
      var directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];

      for (var i = 0; i < directions.length; i++) {
        var newRow = r + directions[i][0];
        var newCol = c + directions[i][1];
        var newKey = newRow + '-' + newCol;

        if (newRow >= 0 && newRow < ROWS && 
            newCol >= 0 && newCol < COLS && 
            !visited.has(newKey) && !gameBoard[newRow][newCol].mine) {
          queue.enqueue({ row: newRow, col: newCol });
          visited.add(newKey);
        }
      }
    }
  }
}

// Reveal all mines
function revealAllMines() {
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      if (gameBoard[i][j].mine) {
        revealed.add(i + '-' + j);
      }
    }
  }
}

// Check win condition
function checkWin() {
  var totalCells = ROWS * COLS;
  var safeCells = totalCells - MINES;

  if (revealed.size() === safeCells) {
    gameWon = true;
    updateMessage('You Win! 🎉');
    clearInterval(timerInterval);
  }
}

// Timer functions
function startTimer() {
  timerInterval = setInterval(function() {
    seconds++;
    updateTimer();
  }, 1000);
}

function updateTimer() {
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  document.getElementById('timer').textContent = 
    (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// Update mine count
function updateMineCount() {
  var remaining = MINES - flagged.size();
  document.getElementById('mineCount').textContent = remaining;
}

// Update score
function updateScore() {
  document.getElementById('moves').textContent = moves;
  var totalSafe = (ROWS * COLS) - MINES;
  document.getElementById('score').textContent = revealed.size() + '/' + totalSafe;
}

// Update message
function updateMessage(msg) {
  var messageElement = document.getElementById('message');
  messageElement.textContent = msg;
  messageElement.className = 'message';
  if (msg.indexOf('Win') !== -1) {
    messageElement.classList.add('win');
  } else if (msg.indexOf('Over') !== -1) {
    messageElement.classList.add('lose');
  }
}

// Event listeners
document.getElementById('newGameBtn').addEventListener('click', init);

// Initialize game on load
init();