// Game constants
const DIFFICULTY = {
    easy: 35,      // Remove 35 cells
    medium: 45,    // Remove 45 cells
    hard: 55       // Remove 55 cells
};

// Game state
let board = null;           // SudokuBoard instance
let solution = null;        // Complete solution grid
let selectedCell = null;    // {row, col} of selected cell
let score = 1000;           // Starting score
let checksUsed = 0;
let hintsUsed = 0;
let startTime = null;
let timerInterval = null;
let gameState = 'waiting';  // 'waiting', 'playing', 'solving', 'complete'
let currentDifficulty = 'medium'; // Fixed to medium/normal
let isSolving = false;      // Flag for auto-solve animation
let solveSpeed = 50;        // Milliseconds between solve steps

// DOM Elements
let gridContainer;
let scoreEl, timerEl;
let overlay, overlayTitle, overlayMessage, overlayStats, playBtn;
let finalScoreEl, finalTimeEl;
let solveBtn;

/**
 * Initialize game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    gridContainer = document.getElementById('sudokuGrid');
    scoreEl = document.getElementById('score');
    timerEl = document.getElementById('timer');
    overlay = document.getElementById('gameOverlay');
    overlayTitle = document.getElementById('overlayTitle');
    overlayMessage = document.getElementById('overlayMessage');
    overlayStats = document.getElementById('overlayStats');
    playBtn = document.getElementById('playBtn');
    finalScoreEl = document.getElementById('finalScore');
    finalTimeEl = document.getElementById('finalTime');
    solveBtn = document.getElementById('solveBtn');

    // Event listeners
    document.getElementById('newBtn').addEventListener('click', startNewGame);
    document.getElementById('checkBtn').addEventListener('click', checkBoard);
    document.getElementById('resetBtn').addEventListener('click', resetPuzzle);
    document.getElementById('hintBtn').addEventListener('click', useHint);
    solveBtn.addEventListener('click', autoSolve);
    playBtn.addEventListener('click', startNewGame);

    // Keyboard input for numbers
    document.addEventListener('keydown', handleKeyPress);

    // Number pad buttons
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.dataset.num);
            handleNumberInput(num);
        });
    });

    // Start game directly without overlay
    startNewGame();
});

/**
 * Start a new game
 */
function startNewGame() {
    hideOverlay();
    stopTimer();
    isSolving = false;

    // Reset state
    board = new SudokuBoard();
    solution = null;
    selectedCell = null;
    score = 1000;
    checksUsed = 0;
    hintsUsed = 0;
    gameState = 'playing';

    // Generate puzzle
    generatePuzzle();

    // Start timer
    startTime = Date.now();
    startTimer();

    // Update display
    updateHUD();
    renderGrid();
    
    // Enable buttons
    if (solveBtn) solveBtn.disabled = false;
}

/**
 * Generate a new Sudoku puzzle using backtracking
 */
function generatePuzzle() {
    // Clear board
    board.clear();

    // Fill the board completely using backtracking
    fillBoard();

    // Save the complete solution
    solution = board.copyGrid();

    // Remove cells based on difficulty
    const cellsToRemove = DIFFICULTY[currentDifficulty];
    removeCells(cellsToRemove);

    // Save as original puzzle
    board.saveAsOriginal();
}

/**
 * Fill the board using backtracking algorithm
 * @returns {boolean} - True if successfully filled
 */
function fillBoard() {
    const empty = board.findEmpty();
    
    if (!empty) {
        return true; // Board is complete
    }

    const { row, col } = empty;
    
    // Try numbers 1-9 in random order
    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
        if (board.isValid(row, col, num)) {
            board.setValue(row, col, num);

            if (fillBoard()) {
                return true;
            }

            // Backtrack
            board.setValue(row, col, 0);
        }
    }

    return false;
}

/**
 * Remove N cells from the board to create puzzle
 * @param {number} count - Number of cells to remove
 */
function removeCells(count) {
    let removed = 0;
    const positions = [];

    // Create list of all positions
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            positions.push({ row: r, col: c });
        }
    }

    // Shuffle positions
    const shuffled = shuffleArray(positions);

    // Remove cells
    for (const pos of shuffled) {
        if (removed >= count) break;
        board.setValue(pos.row, pos.col, 0);
        removed++;
    }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Render the Sudoku grid
 */
function renderGrid() {
    gridContainer.innerHTML = '';

    const conflicts = board.getConflicts();
    const conflictSet = new Set(conflicts.map(c => `${c.row},${c.col}`));

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const value = board.getValue(row, col);
            
            if (value !== 0) {
                cell.textContent = value;
            }

            // Add classes for styling
            if (board.isOriginal(row, col)) {
                cell.classList.add('original');
            }

            if (conflictSet.has(`${row},${col}`)) {
                cell.classList.add('error');
            }

            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add('selected');
            }

            // Highlight same number
            if (selectedCell && value !== 0 && value === board.getValue(selectedCell.row, selectedCell.col)) {
                cell.classList.add('highlight');
            }

            // Highlight same row/col/box as selected
            if (selectedCell && !cell.classList.contains('selected')) {
                if (row === selectedCell.row || col === selectedCell.col) {
                    cell.classList.add('related');
                }
                // Check if in same 3x3 box
                const selBoxRow = Math.floor(selectedCell.row / 3);
                const selBoxCol = Math.floor(selectedCell.col / 3);
                const cellBoxRow = Math.floor(row / 3);
                const cellBoxCol = Math.floor(col / 3);
                if (selBoxRow === cellBoxRow && selBoxCol === cellBoxCol) {
                    cell.classList.add('related');
                }
            }

            // Click handler
            cell.addEventListener('click', () => handleCellClick(row, col));

            gridContainer.appendChild(cell);
        }
    }
}

/**
 * Handle cell click
 */
function handleCellClick(row, col) {
    if (gameState !== 'playing' || isSolving) return;

    // Toggle selection
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
        selectedCell = null;
    } else {
        selectedCell = { row, col };
    }

    renderGrid();
}

/**
 * Handle number input from keyboard or number pad
 */
function handleNumberInput(num) {
    if (gameState !== 'playing' || !selectedCell || isSolving) return;

    // Don't allow editing original cells
    if (board.isOriginal(selectedCell.row, selectedCell.col)) return;

    if (num >= 1 && num <= 9) {
        board.setValue(selectedCell.row, selectedCell.col, num);
        renderGrid();
        checkWinCondition();
    } else if (num === 0) {
        board.setValue(selectedCell.row, selectedCell.col, 0);
        renderGrid();
    }
}

/**
 * Handle keyboard input
 */
function handleKeyPress(e) {
    if (gameState !== 'playing' || !selectedCell || isSolving) return;

    const key = e.key;

    // Arrow key navigation
    if (key === 'ArrowUp' && selectedCell.row > 0) {
        selectedCell.row--;
        renderGrid();
        return;
    } else if (key === 'ArrowDown' && selectedCell.row < 8) {
        selectedCell.row++;
        renderGrid();
        return;
    } else if (key === 'ArrowLeft' && selectedCell.col > 0) {
        selectedCell.col--;
        renderGrid();
        return;
    } else if (key === 'ArrowRight' && selectedCell.col < 8) {
        selectedCell.col++;
        renderGrid();
        return;
    }

    // Don't allow editing original cells
    if (board.isOriginal(selectedCell.row, selectedCell.col)) return;

    if (key >= '1' && key <= '9') {
        const num = parseInt(key);
        board.setValue(selectedCell.row, selectedCell.col, num);
        renderGrid();
        checkWinCondition();
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        board.setValue(selectedCell.row, selectedCell.col, 0);
        renderGrid();
    }
}

/**
 * Check if player has won
 */
function checkWinCondition() {
    if (board.isComplete()) {
        gameState = 'complete';
        stopTimer();

        // Calculate time bonus
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeBonus = Math.max(0, 500 - elapsed);
        score += timeBonus;

        showOverlay('complete');
    }
}

/**
 * Check board for errors (deducts points)
 */
function checkBoard() {
    if (gameState !== 'playing' || isSolving) return;

    checksUsed++;
    score = Math.max(0, score - 10);

    renderGrid();
    updateHUD();
}

/**
 * Use a hint (deducts points)
 */
function useHint() {
    if (gameState !== 'playing' || isSolving) return;

    const hint = board.getHint(solution);
    
    if (hint) {
        hintsUsed++;
        score = Math.max(0, score - 10);

        board.setValue(hint.row, hint.col, hint.value);
        selectedCell = { row: hint.row, col: hint.col };

        renderGrid();
        updateHUD();
        checkWinCondition();
    }
}

/**
 * Auto-Solve with animation using backtracking
 * Shows the computer trying different numbers and backtracking in real-time
 */
function autoSolve() {
    if (gameState !== 'playing' || isSolving) return;

    isSolving = true;
    gameState = 'solving';
    
    // Reset to original puzzle before solving
    board.resetToOriginal();
    renderGrid();

    // Disable buttons during solve
    if (solveBtn) solveBtn.disabled = true;

    // Start the animated solve
    solveWithAnimation();
}

/**
 * Recursive backtracking solver with setTimeout animation
 */
function solveWithAnimation() {
    const steps = [];
    
    // Generate all steps first
    generateSolveSteps(board.copyGrid(), steps);
    
    // Animate the steps
    animateSolveSteps(steps, 0);
}

/**
 * Generate all solve steps for animation
 */
function generateSolveSteps(grid, steps) {
    const tempBoard = new SudokuBoard();
    tempBoard.loadGrid(grid);
    
    solveRecursive(tempBoard, steps);
}

/**
 * Recursive solve that records all steps
 */
function solveRecursive(tempBoard, steps) {
    const empty = tempBoard.findEmpty();
    
    if (!empty) {
        return true; // Solved!
    }
    
    const { row, col } = empty;
    
    for (let num = 1; num <= 9; num++) {
        // Record trying this number
        steps.push({ type: 'try', row, col, num });
        
        if (tempBoard.isValid(row, col, num)) {
            tempBoard.setValue(row, col, num);
            steps.push({ type: 'place', row, col, num });
            
            if (solveRecursive(tempBoard, steps)) {
                return true;
            }
            
            // Backtrack
            tempBoard.setValue(row, col, 0);
            steps.push({ type: 'backtrack', row, col, num: 0 });
        }
    }
    
    return false;
}

/**
 * Animate solve steps with setTimeout
 */
function animateSolveSteps(steps, index) {
    if (!isSolving || index >= steps.length) {
        // Finished solving
        isSolving = false;
        gameState = 'complete';
        stopTimer();
        
        // Score is 0 for auto-solve
        score = 0;
        
        renderGrid();
        showOverlay('solved');
        return;
    }
    
    const step = steps[index];
    
    if (step.type === 'try') {
        // Show trying animation
        board.setValue(step.row, step.col, step.num);
        updateCell(step.row, step.col, 'trying');
    } else if (step.type === 'place') {
        // Place the number
        board.setValue(step.row, step.col, step.num);
        updateCell(step.row, step.col);
    } else if (step.type === 'backtrack') {
        // Backtrack - clear the cell
        board.setValue(step.row, step.col, 0);
        updateCell(step.row, step.col, 'backtrack');
    }
    
    // Schedule next step
    setTimeout(() => {
        animateSolveSteps(steps, index + 1);
    }, solveSpeed);
}

/**
 * Update a single cell in the grid (for animation)
 */
function updateCell(row, col, addClass = null) {
    const cellIndex = row * 9 + col;
    const cell = gridContainer.children[cellIndex];
    if (!cell) return;

    const value = board.getValue(row, col);
    cell.textContent = value !== 0 ? value : '';
    
    // Remove animation classes
    cell.classList.remove('trying', 'backtrack');
    
    if (addClass) {
        cell.classList.add(addClass);
    }
}

/**
 * Reset puzzle to original state
 */
function resetPuzzle() {
    if (!board || isSolving) return;

    board.resetToOriginal();
    selectedCell = null;
    renderGrid();
}

/**
 * Timer functions
 */
function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Update HUD display
 */
function updateHUD() {
    scoreEl.textContent = score;
}

/**
 * Show overlay
 */
function showOverlay(state) {
    overlay.classList.remove('hidden');

    switch (state) {
        case 'complete':
            overlayTitle.textContent = '🎉 Puzzle Complete!';
            overlayMessage.textContent = 'Congratulations! You solved the puzzle!';
            overlayStats.style.display = 'flex';
            finalScoreEl.textContent = score;
            finalTimeEl.textContent = timerEl.textContent;
            playBtn.textContent = '↻ New Game';
            break;
        case 'solved':
            overlayTitle.textContent = '🤖 Auto-Solved!';
            overlayMessage.textContent = 'The puzzle was solved by the computer.';
            overlayStats.style.display = 'flex';
            finalScoreEl.textContent = 0;
            finalTimeEl.textContent = timerEl.textContent;
            playBtn.textContent = '↻ New Game';
            break;
    }
}

/**
 * Hide overlay
 */
function hideOverlay() {
    overlay.classList.add('hidden');
}
