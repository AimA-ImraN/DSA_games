/**
 * Memory Match Game
 * Uses CardHashTable from data structures.js for card state management
 * Uses fisherYatesShuffle from data structures.js for randomization
 */

// Game state
let cardHashTable = null;       // CardHashTable instance
let flippedCards = [];          // Array to track currently flipped cards (max 2)
let score = 0;                  // Current score
let moves = 0;                  // Number of moves (pairs attempted)
let matchedPairs = 0;           // Number of matched pairs
let totalPairs = 8;             // Total pairs to match
let startTime = null;           // Game start time
let timerInterval = null;       // Timer interval reference
let gameState = 'waiting';      // 'waiting', 'playing', 'checking', 'complete'
let isLocked = false;           // Prevent clicks during card flip animation

// DOM Elements
let cardGrid;
let scoreEl, movesEl, matchedEl, timerEl;
let overlay, overlayTitle, overlayMessage, overlayStats;
let finalScoreEl, finalTimeEl, finalMovesEl, playBtn;

/**
 * Initialize game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    cardGrid = document.getElementById('cardGrid');
    scoreEl = document.getElementById('score');
    movesEl = document.getElementById('moves');
    matchedEl = document.getElementById('matched');
    timerEl = document.getElementById('timer');
    overlay = document.getElementById('gameOverlay');
    overlayTitle = document.getElementById('overlayTitle');
    overlayMessage = document.getElementById('overlayMessage');
    overlayStats = document.getElementById('overlayStats');
    finalScoreEl = document.getElementById('finalScore');
    finalTimeEl = document.getElementById('finalTime');
    finalMovesEl = document.getElementById('finalMoves');
    playBtn = document.getElementById('playBtn');

    // Event listeners
    document.getElementById('newBtn').addEventListener('click', startNewGame);
    playBtn.addEventListener('click', startNewGame);

    // Start game immediately
    startNewGame();
});

/**
 * Start a new game
 */
function startNewGame() {
    hideOverlay();
    stopTimer();

    // Reset state
    cardHashTable = new CardHashTable();
    flippedCards = [];
    score = 0;
    moves = 0;
    matchedPairs = 0;
    gameState = 'playing';
    isLocked = false;

    // Setup the game
    setupGame();

    // Start timer
    startTime = Date.now();
    startTimer();

    // Update display
    updateHUD();
}

/**
 * Setup the game board
 * Duplicates SYMBOLS array to create pairs, shuffles, and initializes hash table
 */
function setupGame() {
    // Duplicate symbols to create pairs (8 symbols x 2 = 16 cards)
    const cardSymbols = [...SYMBOLS, ...SYMBOLS];

    // Shuffle using Fisher-Yates from data structures.js
    const shuffledSymbols = fisherYatesShuffle(cardSymbols);

    // Initialize hash table with shuffled symbols
    for (let i = 0; i < shuffledSymbols.length; i++) {
        cardHashTable.set(i, {
            symbol: shuffledSymbols[i],
            isFlipped: false,
            isMatched: false
        });
    }

    // Render the grid
    renderGrid();
}

/**
 * Render the card grid
 */
function renderGrid() {
    cardGrid.innerHTML = '';

    // Get all card indices
    const cardIndices = cardHashTable.keys().sort((a, b) => a - b);

    for (const index of cardIndices) {
        const cardState = cardHashTable.get(index);
        const cardEl = createCardElement(index, cardState);
        cardGrid.appendChild(cardEl);
    }
}

/**
 * Create a card DOM element
 * @param {number} index - Card index
 * @param {Object} state - Card state from hash table
 * @returns {HTMLElement} - Card element
 */
function createCardElement(index, state) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;

    // Add flipped class if card is flipped or matched
    if (state.isFlipped || state.isMatched) {
        card.classList.add('flipped');
    }

    // Add matched class if card is matched
    if (state.isMatched) {
        card.classList.add('matched');
    }

    // Create inner card structure for flip animation
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${state.symbol}</div>
        </div>
    `;

    // Add click handler
    card.addEventListener('click', () => handleCardClick(index));

    return card;
}

/**
 * Handle card click
 * @param {number} cardIndex - Index of clicked card
 */
function handleCardClick(cardIndex) {
    // Prevent interaction if game is not playing or locked
    if (gameState !== 'playing' || isLocked) return;

    // Get card state from hash table
    const cardState = cardHashTable.get(cardIndex);

    // Check if card is already flipped or matched
    if (cardState.isFlipped || cardState.isMatched) return;

    // Check if we already have 2 cards flipped
    if (flippedCards.length >= 2) return;

    // Flip the card - update hash table
    cardHashTable.update(cardIndex, { isFlipped: true });

    // Add to flipped cards array
    flippedCards.push(cardIndex);

    // Update the card visually
    updateCardElement(cardIndex);

    // Check if we have 2 cards flipped
    if (flippedCards.length === 2) {
        moves++;
        updateHUD();
        checkForMatch();
    }
}

/**
 * Update a single card element
 * @param {number} cardIndex - Index of card to update
 */
function updateCardElement(cardIndex) {
    const cardEl = cardGrid.querySelector(`[data-index="${cardIndex}"]`);
    if (!cardEl) return;

    const cardState = cardHashTable.get(cardIndex);

    // Update classes
    if (cardState.isFlipped || cardState.isMatched) {
        cardEl.classList.add('flipped');
    } else {
        cardEl.classList.remove('flipped');
    }

    if (cardState.isMatched) {
        cardEl.classList.add('matched');
    }
}

/**
 * Check if the two flipped cards match
 */
function checkForMatch() {
    isLocked = true; // Lock interaction during check

    const [index1, index2] = flippedCards;
    const card1 = cardHashTable.get(index1);
    const card2 = cardHashTable.get(index2);

    if (card1.symbol === card2.symbol) {
        // Match found!
        handleMatch(index1, index2);
    } else {
        // No match
        handleMismatch(index1, index2);
    }
}

/**
 * Handle matching cards
 * @param {number} index1 - First card index
 * @param {number} index2 - Second card index
 */
function handleMatch(index1, index2) {
    // Update hash table - mark as matched
    cardHashTable.update(index1, { isMatched: true, isFlipped: true });
    cardHashTable.update(index2, { isMatched: true, isFlipped: true });

    // Update score: +100 for a match
    score += 100;
    matchedPairs++;

    // Update visuals
    const card1El = cardGrid.querySelector(`[data-index="${index1}"]`);
    const card2El = cardGrid.querySelector(`[data-index="${index2}"]`);
    
    if (card1El) card1El.classList.add('matched');
    if (card2El) card2El.classList.add('matched');

    // Clear flipped cards array
    flippedCards = [];
    isLocked = false;

    // Update HUD
    updateHUD();

    // Check for game over
    checkGameOver();
}

/**
 * Handle mismatching cards
 * @param {number} index1 - First card index
 * @param {number} index2 - Second card index
 */
function handleMismatch(index1, index2) {
    // Update score: -10 for a mismatch
    score = Math.max(0, score - 10);

    // Add mismatch animation class
    const card1El = cardGrid.querySelector(`[data-index="${index1}"]`);
    const card2El = cardGrid.querySelector(`[data-index="${index2}"]`);
    
    if (card1El) card1El.classList.add('mismatch');
    if (card2El) card2El.classList.add('mismatch');

    // Wait 1 second, then flip cards back
    setTimeout(() => {
        // Update hash table - flip back
        cardHashTable.update(index1, { isFlipped: false });
        cardHashTable.update(index2, { isFlipped: false });

        // Remove mismatch class
        if (card1El) card1El.classList.remove('mismatch');
        if (card2El) card2El.classList.remove('mismatch');

        // Update visuals
        updateCardElement(index1);
        updateCardElement(index2);

        // Clear flipped cards array
        flippedCards = [];
        isLocked = false;

        // Update HUD
        updateHUD();
    }, 1000);
}

/**
 * Check if game is over (all cards matched)
 */
function checkGameOver() {
    // Use hash table's allMatched method
    if (cardHashTable.allMatched()) {
        gameState = 'complete';
        stopTimer();
        showVictory();
    }
}

/**
 * Show victory overlay
 */
function showVictory() {
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '🎉 Victory!';
    overlayMessage.textContent = 'You found all the matches!';
    overlayStats.style.display = 'flex';
    finalScoreEl.textContent = score;
    finalTimeEl.textContent = timerEl.textContent;
    finalMovesEl.textContent = moves;
}

/**
 * Hide overlay
 */
function hideOverlay() {
    overlay.classList.add('hidden');
}

/**
 * Update HUD display
 */
function updateHUD() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    matchedEl.textContent = matchedPairs;
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