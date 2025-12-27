// Game constants
const NUM_FILLED_TUBES = 3;
const NUM_EMPTY_TUBES = 2;
const TUBE_CAPACITY = 4;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

// Game state
let tubes = [];              // Array of Stack objects
let selectedTube = null;     // Index of currently selected tube
let score = 0;
let moves = 0;
let sortedTubes = 0;
let moveHistory = [];        // For undo functionality
let gameState = 'waiting';   // 'waiting', 'playing', 'complete'

// DOM Elements
let tubesContainer;
let scoreEl, movesEl, sortedEl;
let overlay, overlayTitle, overlayMessage, overlayStats, playBtn;
let finalScoreEl, finalMovesEl;
let undoBtn;

/**
 * Initialize game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    tubesContainer = document.getElementById('tubesContainer');
    scoreEl = document.getElementById('score');
    movesEl = document.getElementById('moves');
    sortedEl = document.getElementById('sorted');
    overlay = document.getElementById('gameOverlay');
    overlayTitle = document.getElementById('overlayTitle');
    overlayMessage = document.getElementById('overlayMessage');
    overlayStats = document.getElementById('overlayStats');
    playBtn = document.getElementById('playBtn');
    finalScoreEl = document.getElementById('finalScore');
    finalMovesEl = document.getElementById('finalMoves');
    undoBtn = document.getElementById('undoBtn');
    
    // Event listeners
    document.getElementById('newBtn').addEventListener('click', startNewGame);
    playBtn.addEventListener('click', () => {
        startNewGame();
    });
    undoBtn.addEventListener('click', undoMove);
    
    // Start game directly
    startNewGame();
});

/**
 * Start a new game
 */
function startNewGame() {
    hideOverlay();
    
    // Reset state
    tubes = [];
    selectedTube = null;
    score = 0;
    moves = 0;
    sortedTubes = 0;
    moveHistory = [];
    gameState = 'playing';
    
    // Create tubes (Stacks)
    initTubes();
    
    // Update display
    updateHUD();
    renderTubes();
    
    undoBtn.disabled = true;
}

/**
 * Initialize tubes with random colors
 */
function initTubes() {
    // Select colors for this game (one per filled tube)
    const gameColors = COLORS.slice(0, NUM_FILLED_TUBES);
    
    // Create color pool (4 of each color)
    let colorPool = [];
    gameColors.forEach(color => {
        for (let i = 0; i < TUBE_CAPACITY; i++) {
            colorPool.push(color);
        }
    });
    
    // Shuffle the color pool
    colorPool = shuffleArray(colorPool);
    
    // Create filled tubes
    for (let i = 0; i < NUM_FILLED_TUBES; i++) {
        const tube = new Stack(TUBE_CAPACITY);
        for (let j = 0; j < TUBE_CAPACITY; j++) {
            tube.push(colorPool.pop());
        }
        tubes.push(tube);
    }
    
    // Create empty tubes
    for (let i = 0; i < NUM_EMPTY_TUBES; i++) {
        tubes.push(new Stack(TUBE_CAPACITY));
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
 * Render all tubes
 */
function renderTubes() {
    tubesContainer.innerHTML = '';
    
    tubes.forEach((tube, index) => {
        const tubeEl = document.createElement('div');
        tubeEl.className = 'tube';
        tubeEl.dataset.index = index;
        
        // Check if complete
        if (tube.isComplete()) {
            tubeEl.classList.add('complete');
        }
        
        // Check if selected
        if (selectedTube === index) {
            tubeEl.classList.add('selected');
        }
        
        // Add water segments
        const colors = tube.toArray();
        colors.forEach((color, segIndex) => {
            const segment = document.createElement('div');
            segment.className = `water-segment ${color}`;
            tubeEl.appendChild(segment);
        });
        
        // Click handler
        tubeEl.addEventListener('click', () => handleTubeClick(index));
        
        tubesContainer.appendChild(tubeEl);
    });
}

/**
 * Handle tube click
 */
function handleTubeClick(index) {
    if (gameState !== 'playing') return;
    
    const clickedTube = tubes[index];
    
    if (selectedTube === null) {
        // No tube selected - select this one if it has water
        if (!clickedTube.isEmpty()) {
            selectedTube = index;
            renderTubes();
        }
    } else if (selectedTube === index) {
        // Clicked same tube - deselect
        selectedTube = null;
        renderTubes();
    } else {
        // Try to pour from selected to clicked
        const sourceTube = tubes[selectedTube];
        const destTube = clickedTube;
        
        if (isValidMove(sourceTube, destTube)) {
            // Perform pour
            performPour(selectedTube, index);
        } else {
            // Invalid move - shake animation
            const tubeEl = tubesContainer.children[index];
            tubeEl.classList.add('invalid');
            setTimeout(() => tubeEl.classList.remove('invalid'), 300);
        }
        
        selectedTube = null;
        renderTubes();
    }
}

/**
 * Check if a move is valid
 * Move is valid if: destination is not full AND (destination is empty OR top colors match)
 */
function isValidMove(source, dest) {
    // Can't pour from empty
    if (source.isEmpty()) return false;
    
    // Can't pour into full tube
    if (dest.isFull()) return false;
    
    // Can pour into empty tube
    if (dest.isEmpty()) return true;
    
    // Can pour if top colors match
    return source.peek() === dest.peek();
}

/**
 * Perform pour from source to destination
 */
function performPour(sourceIndex, destIndex) {
    const source = tubes[sourceIndex];
    const dest = tubes[destIndex];
    
    // Save state for undo
    const moveData = {
        from: sourceIndex,
        to: destIndex,
        colors: []
    };
    
    // Pour all matching top colors
    const colorToPour = source.peek();
    
    while (!source.isEmpty() && !dest.isFull() && source.peek() === colorToPour) {
        const color = source.pop();
        dest.push(color);
        moveData.colors.push(color);
    }
    
    // Record move
    moveHistory.push(moveData);
    moves++;
    undoBtn.disabled = false;
    
    // Check for completed tubes
    checkCompletedTubes();
    
    // Update display
    updateHUD();
    
    // Check for game complete
    checkGameComplete();
}

/**
 * Check for newly completed tubes and award points
 */
function checkCompletedTubes() {
    let newSortedCount = 0;
    
    tubes.forEach(tube => {
        if (tube.isComplete()) {
            newSortedCount++;
        }
    });
    
    // Award points for newly completed tubes
    if (newSortedCount > sortedTubes) {
        const newlyCompleted = newSortedCount - sortedTubes;
        score += newlyCompleted * 50;
    }
    
    sortedTubes = newSortedCount;
}

/**
 * Check if game is complete
 * All filled tubes must have 4 matching colors
 */
function checkGameComplete() {
    let allSorted = true;
    let filledTubeCount = 0;
    
    tubes.forEach(tube => {
        if (!tube.isEmpty()) {
            filledTubeCount++;
            if (!tube.isComplete()) {
                allSorted = false;
            }
        }
    });
    
    // Game is complete when all non-empty tubes are complete
    // and we have the right number of filled tubes
    if (allSorted && filledTubeCount === NUM_FILLED_TUBES) {
        gameState = 'complete';
        showOverlay('complete');
    }
}

/**
 * Undo last move
 */
function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    const source = tubes[lastMove.from];
    const dest = tubes[lastMove.to];
    
    // Reverse the pour - pop from destination and push back to source
    // Colors were pushed in order, so we need to pop them in reverse order
    for (let i = lastMove.colors.length - 1; i >= 0; i--) {
        dest.pop();
        source.push(lastMove.colors[i]);
    }
    
    // Don't increment moves for undo
    selectedTube = null;
    
    // Recalculate sorted tubes
    checkCompletedTubes();
    
    updateHUD();
    renderTubes();
    
    if (moveHistory.length === 0) {
        undoBtn.disabled = true;
    }
}

/**
 * Update HUD display
 */
function updateHUD() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    sortedEl.textContent = sortedTubes;
}

/**
 * Show overlay with different states
 */
function showOverlay(state) {
    overlay.classList.remove('hidden');
    
    if (state === 'complete') {
        overlayTitle.textContent = '🎉 Level Complete!';
        overlayMessage.textContent = 'All colors sorted!';
        overlayStats.style.display = 'flex';
        finalScoreEl.textContent = score;
        finalMovesEl.textContent = moves;
        playBtn.textContent = '↻ New Game';
    }
}

/**
 * Hide overlay
 */
function hideOverlay() {
    overlay.classList.add('hidden');
}
