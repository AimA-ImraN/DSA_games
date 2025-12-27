/**
 * Tower of Hanoi Game
 * Uses Stack data structure and recursive solving algorithm
 */

// Game State
let pegs = {
    A: null,
    B: null,
    C: null
};
let diskCount = 5;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let selectedPeg = null;
let isSolving = false;
let animationSpeed = 500;

// DOM Elements
const resetBtn = document.getElementById('reset-btn');
const solveBtn = document.getElementById('solve-btn');
const movesEl = document.getElementById('moves');
const minMovesEl = document.getElementById('min-moves');
const timerEl = document.getElementById('timer');
const warningEl = document.getElementById('warning');
const victoryEl = document.getElementById('victory');
const victoryMovesEl = document.getElementById('victory-moves');
const victoryMinEl = document.getElementById('victory-min');
const victoryTimeEl = document.getElementById('victory-time');
const playAgainBtn = document.getElementById('play-again-btn');
const boardEl = document.getElementById('board');

// Tower Elements
const towerA = document.getElementById('tower-A');
const towerB = document.getElementById('tower-B');
const towerC = document.getElementById('tower-C');
const disksA = document.getElementById('disks-A');
const disksB = document.getElementById('disks-B');
const disksC = document.getElementById('disks-C');

/**
 * Initialize the game
 */
function initGame() {
    // Stop any ongoing solve
    isSolving = false;
    boardEl.classList.remove('solving');
    
    // Reset timer
    stopTimer();
    seconds = 0;
    updateTimer();
    
    // Reset moves
    moves = 0;
    updateMoves();
    
    // Clear selection
    clearSelection();
    hideWarning();
    hideVictory();
    
    // Disk count is fixed at 5
    diskCount = 5;
    animationSpeed = 800; // Slower speed for better visualization
    
    // Update minimum moves display (2^n - 1)
    const minMoves = Math.pow(2, diskCount) - 1;
    minMovesEl.textContent = minMoves;
    victoryMinEl.textContent = minMoves;
    
    // Initialize stacks
    pegs.A = new Stack();
    pegs.B = new Stack();
    pegs.C = new Stack();
    
    // Push disks onto Peg A (largest first, so smallest ends up on top)
    for (let i = diskCount; i >= 1; i--) {
        pegs.A.push(i);
    }
    
    // Render all towers
    renderAllTowers();
}

/**
 * Render all three towers
 */
function renderAllTowers() {
    renderTower('A', disksA);
    renderTower('B', disksB);
    renderTower('C', disksC);
}

/**
 * Render a single tower's disks
 */
function renderTower(pegName, container) {
    container.innerHTML = '';
    
    const disks = pegs[pegName].toArray();
    
    for (let i = 0; i < disks.length; i++) {
        const diskSize = disks[i];
        const diskEl = document.createElement('div');
        diskEl.className = 'disk';
        diskEl.setAttribute('data-size', diskSize);
        diskEl.textContent = diskSize;
        
        // Add moving animation for the top disk when just placed
        if (i === disks.length - 1) {
            diskEl.classList.add('moving');
            setTimeout(() => diskEl.classList.remove('moving'), 300);
        }
        
        container.appendChild(diskEl);
    }
}

/**
 * Handle tower click for manual play
 */
function handleTowerClick(pegName) {
    if (isSolving) return;
    
    // Start timer on first interaction
    if (moves === 0 && !timerInterval) {
        startTimer();
    }
    
    const peg = pegs[pegName];
    
    if (selectedPeg === null) {
        // No peg selected - try to select this one
        if (peg.isEmpty()) {
            // Can't select empty peg
            return;
        }
        
        // Select this peg
        selectedPeg = pegName;
        document.getElementById('tower-' + pegName).classList.add('selected');
    } else {
        // A peg is already selected
        if (selectedPeg === pegName) {
            // Clicked same peg - deselect
            clearSelection();
            return;
        }
        
        // Try to move disk from selected peg to this peg
        const sourcePeg = pegs[selectedPeg];
        const destPeg = pegs[pegName];
        const diskToMove = sourcePeg.peek();
        
        // Validate move using canAccept
        if (destPeg.canAccept(diskToMove)) {
            // Valid move
            moveDisk(selectedPeg, pegName);
            clearSelection();
            
            // Check for win
            checkWin();
        } else {
            // Invalid move - show warning
            showWarning();
            clearSelection();
        }
    }
}

/**
 * Move a disk from source to destination
 */
function moveDisk(source, dest) {
    const disk = pegs[source].pop();
    pegs[dest].push(disk);
    moves++;
    updateMoves();
    renderAllTowers();
}

/**
 * Clear peg selection
 */
function clearSelection() {
    selectedPeg = null;
    towerA.classList.remove('selected');
    towerB.classList.remove('selected');
    towerC.classList.remove('selected');
}

/**
 * Show warning message
 */
function showWarning() {
    warningEl.classList.add('show');
    setTimeout(function() {
        hideWarning();
    }, 2000);
}

/**
 * Hide warning message
 */
function hideWarning() {
    warningEl.classList.remove('show');
}

/**
 * Check if puzzle is solved
 */
function checkWin() {
    // All disks should be on Peg C
    if (pegs.C.size() === diskCount) {
        stopTimer();
        showVictory();
    }
}

/**
 * Show victory screen
 */
function showVictory() {
    victoryMovesEl.textContent = moves;
    victoryTimeEl.textContent = formatTime(seconds);
    victoryEl.classList.add('show');
}

/**
 * Hide victory screen
 */
function hideVictory() {
    victoryEl.classList.remove('show');
}

/**
 * Update moves display
 */
function updateMoves() {
    movesEl.textContent = moves;
}

/**
 * Start timer
 */
function startTimer() {
    if (timerInterval) return;
    
    timerInterval = setInterval(function() {
        seconds++;
        updateTimer();
    }, 1000);
}

/**
 * Stop timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update timer display
 */
function updateTimer() {
    timerEl.textContent = formatTime(seconds);
}

/**
 * Format seconds to MM:SS
 */
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

/**
 * Sleep utility for animations
 */
function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

/**
 * Recursive Tower of Hanoi solving algorithm
 * Moves n disks from source to target using auxiliary
 * @param {number} n - Number of disks to move
 * @param {string} source - Source peg name ('A', 'B', or 'C')
 * @param {string} target - Target peg name
 * @param {string} auxiliary - Auxiliary peg name
 */
async function solve(n, source, target, auxiliary) {
    // Base case: no disks to move
    if (n === 0 || !isSolving) return;
    
    // Step 1: Move n-1 disks from source to auxiliary peg
    await solve(n - 1, source, auxiliary, target);
    
    if (!isSolving) return;
    
    // Step 2: Move the nth (largest) disk from source to target
    moveDisk(source, target);
    await sleep(animationSpeed);
    
    if (!isSolving) return;
    
    // Step 3: Move n-1 disks from auxiliary to target peg
    await solve(n - 1, auxiliary, target, source);
}

/**
 * Start auto-solve animation
 */
async function startAutoSolve() {
    if (isSolving) {
        // Stop solving
        isSolving = false;
        boardEl.classList.remove('solving');
        solveBtn.textContent = 'Auto Solve';
        return;
    }
    
    // Reset to initial state first
    initGame();
    
    // Start solving
    isSolving = true;
    boardEl.classList.add('solving');
    solveBtn.textContent = 'Stop';
    
    // Start timer
    startTimer();
    
    // Run recursive solve: move diskCount disks from A to C using B
    await solve(diskCount, 'A', 'C', 'B');
    
    // Finished solving
    isSolving = false;
    boardEl.classList.remove('solving');
    solveBtn.textContent = 'Auto Solve';
    
    // Check win (should always win after auto-solve)
    if (pegs.C.size() === diskCount) {
        stopTimer();
        showVictory();
    }
}

// Event Listeners
towerA.addEventListener('click', function() { handleTowerClick('A'); });
towerB.addEventListener('click', function() { handleTowerClick('B'); });
towerC.addEventListener('click', function() { handleTowerClick('C'); });

resetBtn.addEventListener('click', initGame);
solveBtn.addEventListener('click', startAutoSolve);
playAgainBtn.addEventListener('click', initGame);

// Initialize game on load
document.addEventListener('DOMContentLoaded', initGame);
