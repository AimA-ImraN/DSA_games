/**
 * Freecell Card Game
 * Uses array of stacks for tableau, free cells, and foundations
 */

// Game Constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SYMBOL = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

// Game State
let tableau = [];        // 8 tableau stacks
let freeCells = [];      // 4 free cell stacks (max size 1)
let foundations = [];    // 4 foundation stacks (one per suit)
let score = 0;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let selectedCard = null;
let selectedSource = null;
let selectedIndex = null;
let history = [];        // For undo functionality
let isAutoCompleting = false;

// Drag and Drop State
let dragState = null;

// DOM Elements
const tableauEl = document.getElementById('tableau');
const freeCellsEl = document.getElementById('free-cells');
const foundationsEl = document.getElementById('foundations');
const scoreEl = document.getElementById('score');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');
const hintBtn = document.getElementById('hint-btn');

/**
 * Initialize a new game
 */
function initGame() {
    // Clear previous state
    clearSelection();
    stopTimer();
    
    // Reset score and moves
    score = 0;
    moves = 0;
    seconds = 0;
    history = [];
    isAutoCompleting = false;
    updateDisplay();
    if (undoBtn) undoBtn.disabled = true;
    
    // Initialize stacks
    tableau = [];
    for (let i = 0; i < 8; i++) {
        tableau.push(new Stack());
    }
    
    freeCells = [];
    for (let i = 0; i < 4; i++) {
        freeCells.push(new Stack(1)); // Max size 1
    }
    
    foundations = [];
    for (let i = 0; i < 4; i++) {
        foundations.push(new Stack());
        foundations[i].suit = SUITS[i]; // Assign suit to each foundation
    }
    
    // Create and shuffle deck
    const deck = new Deck();
    deck.shuffle();
    
    // Deal cards to tableau (8 columns)
    // First 4 columns get 7 cards, last 4 get 6 cards = 28 + 24 = 52 cards
    let cardIndex = 0;
    for (let col = 0; col < 8; col++) {
        const numCards = (col < 4) ? 7 : 6;
        for (let row = 0; row < numCards; row++) {
            const card = deck.cards[cardIndex];
            tableau[col].push(card);
            cardIndex++;
        }
    }
    
    // Start timer
    startTimer();
    
    // Render the game
    renderAll();
}

/**
 * Render all game elements
 */
function renderAll() {
    renderTableau();
    renderFreeCells();
    renderFoundations();
    updateDisplay();
}

/**
 * Render tableau columns
 */
function renderTableau() {
    tableauEl.innerHTML = '';
    
    for (let col = 0; col < 8; col++) {
        const colEl = document.createElement('div');
        colEl.className = 'column';
        colEl.dataset.col = col;
        colEl.dataset.type = 'tableau';
        
        const cards = tableau[col].toArray();
        
        if (cards.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.innerHTML = '<span class="placeholder-text">Empty</span>';
            colEl.appendChild(placeholder);
        }
        
        cards.forEach((card, idx) => {
            const cardEl = createCardElement(card);
            cardEl.style.top = (idx * 30) + 'px';
            cardEl.dataset.col = col;
            cardEl.dataset.index = idx;
            cardEl.dataset.type = 'tableau';
            
            // Click handler
            cardEl.addEventListener('click', (e) => handleCardClick(e, 'tableau', col, idx));
            
            // Drag handlers
            cardEl.addEventListener('mousedown', (e) => handleDragStart(e, 'tableau', col, idx));
            
            colEl.appendChild(cardEl);
        });
        
        // Allow clicking empty column
        colEl.addEventListener('click', (e) => {
            if (e.target === colEl || e.target.classList.contains('placeholder')) {
                handleEmptyClick('tableau', col);
            }
        });
        
        tableauEl.appendChild(colEl);
    }
}

/**
 * Render free cells
 */
function renderFreeCells() {
    freeCellsEl.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'free-cell';
        cellEl.dataset.index = i;
        cellEl.dataset.type = 'freecell';
        
        const card = freeCells[i].peek();
        
        if (card) {
            const cardEl = createCardElement(card);
            cardEl.style.position = 'absolute';
            cardEl.style.top = '0';
            cardEl.style.left = '0';
            cardEl.dataset.index = i;
            cardEl.dataset.type = 'freecell';
            cardEl.addEventListener('click', (e) => handleCardClick(e, 'freecell', i, 0));
            cardEl.addEventListener('mousedown', (e) => handleDragStart(e, 'freecell', i, 0));
            cellEl.appendChild(cardEl);
        } else {
            cellEl.innerHTML = '<span class="cell-label">Free</span>';
        }
        
        cellEl.addEventListener('click', (e) => {
            if (!freeCells[i].peek()) {
                handleEmptyClick('freecell', i);
            }
        });
        
        freeCellsEl.appendChild(cellEl);
    }
}

/**
 * Render foundation piles
 */
function renderFoundations() {
    foundationsEl.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const foundEl = document.createElement('div');
        foundEl.className = 'foundation';
        foundEl.dataset.index = i;
        foundEl.dataset.suit = SUITS[i];
        foundEl.dataset.type = 'foundation';
        
        const card = foundations[i].peek();
        
        if (card) {
            const cardEl = createCardElement(card);
            cardEl.style.position = 'absolute';
            cardEl.style.top = '0';
            cardEl.style.left = '0';
            foundEl.appendChild(cardEl);
        } else {
            const color = (SUITS[i] === 'hearts' || SUITS[i] === 'diamonds') ? 'red' : 'black';
            foundEl.innerHTML = `<span class="foundation-suit ${color}">${SYMBOL[SUITS[i]]}</span>`;
        }
        
        foundEl.addEventListener('click', (e) => {
            handleEmptyClick('foundation', i);
        });
        
        foundationsEl.appendChild(foundEl);
    }
}

/**
 * Create a card DOM element
 */
function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.cardId = card.id;
    
    if (card.getColor() === 'red') {
        el.classList.add('red');
    }
    
    el.innerHTML = `
        <div class="card-top">
            <span class="card-rank">${card.getRank()}</span>
            <span class="card-suit-icon">${card.getSymbol()}</span>
        </div>
        <div class="card-center">${card.getSymbol()}</div>
    `;
    
    return el;
}

/**
 * Handle card click
 */
function handleCardClick(e, sourceType, sourceIndex, cardIndex) {
    e.stopPropagation();
    
    const clickedCard = getCardAt(sourceType, sourceIndex, cardIndex);
    if (!clickedCard) return;
    
    // If no card is selected, select this one
    if (!selectedCard) {
        // Check if card can be moved (must be top of tableau or in free cell)
        if (sourceType === 'tableau') {
            const stack = tableau[sourceIndex];
            const cards = stack.toArray();
            // Only allow selecting top card for simplicity
            if (cardIndex !== cards.length - 1) {
                // Check if we can move a sequence
                if (!canMoveSequence(sourceIndex, cardIndex)) {
                    return;
                }
            }
        }
        
        selectCard(sourceType, sourceIndex, cardIndex);
        return;
    }
    
    // If a card is already selected, try to move to this location
    if (sourceType === 'tableau') {
        tryMoveToTableau(sourceIndex);
    } else if (sourceType === 'foundation') {
        tryMoveToFoundation(sourceIndex);
    }
}

/**
 * Handle clicking on empty spaces
 */
function handleEmptyClick(targetType, targetIndex) {
    if (!selectedCard) return;
    
    if (targetType === 'tableau') {
        tryMoveToTableau(targetIndex);
    } else if (targetType === 'freecell') {
        tryMoveToFreeCell(targetIndex);
    } else if (targetType === 'foundation') {
        tryMoveToFoundation(targetIndex);
    }
}

/**
 * Select a card
 */
function selectCard(sourceType, sourceIndex, cardIndex) {
    clearSelection();
    
    selectedSource = { type: sourceType, index: sourceIndex };
    selectedIndex = cardIndex;
    selectedCard = getCardAt(sourceType, sourceIndex, cardIndex);
    
    // Highlight selected card(s)
    if (sourceType === 'tableau') {
        const colEl = tableauEl.children[sourceIndex];
        const cards = colEl.querySelectorAll('.card');
        for (let i = cardIndex; i < cards.length; i++) {
            cards[i].classList.add('selected');
        }
    } else if (sourceType === 'freecell') {
        const cellEl = freeCellsEl.children[sourceIndex];
        const cardEl = cellEl.querySelector('.card');
        if (cardEl) cardEl.classList.add('selected');
    }
}

/**
 * Clear selection
 */
function clearSelection() {
    selectedCard = null;
    selectedSource = null;
    selectedIndex = null;
    
    // Remove selection highlight from all cards
    document.querySelectorAll('.card.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

/**
 * Get card at specific location
 */
function getCardAt(type, index, cardIndex) {
    if (type === 'tableau') {
        const cards = tableau[index].toArray();
        return cards[cardIndex] || null;
    } else if (type === 'freecell') {
        return freeCells[index].peek();
    } else if (type === 'foundation') {
        return foundations[index].peek();
    }
    return null;
}

/**
 * Check if a sequence of cards can be moved
 */
function canMoveSequence(colIndex, startIndex) {
    const cards = tableau[colIndex].toArray();
    
    for (let i = startIndex; i < cards.length - 1; i++) {
        const current = cards[i];
        const next = cards[i + 1];
        
        // Must be alternating colors and descending values
        if (current.getColor() === next.getColor()) return false;
        if (current.value !== next.value + 1) return false;
    }
    
    return true;
}

/**
 * Try to move selected card(s) to tableau column
 */
function tryMoveToTableau(colIndex) {
    if (!selectedCard) return;
    
    const targetStack = tableau[colIndex];
    const targetTop = targetStack.peek();
    
    // Check if move is valid
    if (targetTop) {
        // Must be different color and 1 value lower
        if (targetTop.getColor() === selectedCard.getColor()) {
            clearSelection();
            return;
        }
        if (targetTop.value !== selectedCard.value + 1) {
            clearSelection();
            return;
        }
    }
    // Empty column - any card can go there (in standard Freecell, only Kings)
    // For this implementation, we'll allow any card for easier gameplay
    
    // Perform the move
    performMove('tableau', colIndex);
}

/**
 * Try to move selected card to free cell
 */
function tryMoveToFreeCell(cellIndex) {
    if (!selectedCard) return;
    
    // Can only move single cards to free cells
    if (selectedSource.type === 'tableau') {
        const cards = tableau[selectedSource.index].toArray();
        if (selectedIndex !== cards.length - 1) {
            clearSelection();
            return;
        }
    }
    
    if (!freeCells[cellIndex].isEmpty()) {
        clearSelection();
        return;
    }
    
    performMove('freecell', cellIndex);
}

/**
 * Try to move selected card to foundation
 */
function tryMoveToFoundation(foundIndex) {
    if (!selectedCard) return;
    
    // Can only move single cards to foundations
    if (selectedSource.type === 'tableau') {
        const cards = tableau[selectedSource.index].toArray();
        if (selectedIndex !== cards.length - 1) {
            clearSelection();
            return;
        }
    }
    
    const foundation = foundations[foundIndex];
    const foundTop = foundation.peek();
    const targetSuit = SUITS[foundIndex];
    
    // Card must match foundation suit
    if (selectedCard.suit !== targetSuit) {
        clearSelection();
        return;
    }
    
    // Must be next in sequence (Ace on empty, or +1 on top)
    if (foundTop) {
        if (selectedCard.value !== foundTop.value + 1) {
            clearSelection();
            return;
        }
    } else {
        if (selectedCard.value !== 1) { // Must be Ace
            clearSelection();
            return;
        }
    }
    
    performMove('foundation', foundIndex);
}

/**
 * Perform the actual move
 */
function performMove(targetType, targetIndex) {
    const sourceType = selectedSource.type;
    const sourceIndex = selectedSource.index;
    
    // Save state for undo
    saveState();
    
    // Get cards to move
    let cardsToMove = [];
    
    if (sourceType === 'tableau') {
        const stack = tableau[sourceIndex];
        const cards = stack.toArray();
        
        // Pop cards from selected index to top
        const numToMove = cards.length - selectedIndex;
        for (let i = 0; i < numToMove; i++) {
            cardsToMove.unshift(stack.pop());
        }
    } else if (sourceType === 'freecell') {
        cardsToMove.push(freeCells[sourceIndex].pop());
    }
    
    // Push cards to target
    if (targetType === 'tableau') {
        for (const card of cardsToMove) {
            tableau[targetIndex].push(card);
        }
    } else if (targetType === 'freecell') {
        freeCells[targetIndex].push(cardsToMove[0]);
    } else if (targetType === 'foundation') {
        foundations[targetIndex].push(cardsToMove[0]);
        score += 100; // +100 for each card to foundation
    }
    
    moves++;
    clearSelection();
    renderAll();
    checkWinOrAutoComplete();
}

/**
 * Check for win or auto-complete condition
 */
function checkWinOrAutoComplete() {
    let totalInFoundations = 0;
    for (const found of foundations) {
        totalInFoundations += found.size();
    }
    
    if (totalInFoundations === 52) {
        stopTimer();
        showVictory();
        return;
    }
    
    // Check if we can auto-complete (all free cells empty and all tableau columns sorted)
    if (!isAutoCompleting && canAutoComplete()) {
        autoComplete();
    }
}

/**
 * Show victory screen
 */
function showVictory() {
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    overlay.innerHTML = `
        <div class="victory-modal">
            <h2>🎉 Victory!</h2>
            <div class="victory-stats">
                <div class="stat">
                    <span class="stat-label">Final Score</span>
                    <span class="stat-value">${score}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Moves</span>
                    <span class="stat-value">${moves}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Time</span>
                    <span class="stat-value">${timerEl.textContent}</span>
                </div>
            </div>
            <div class="victory-buttons">
                <button class="btn primary" onclick="closeVictoryAndNewGame()">New Game</button>
                <button class="btn" onclick="window.location.href='../mainfile/mainfile.html'">Back to Home</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/**
 * Close victory and start new game
 */
function closeVictoryAndNewGame() {
    const overlay = document.querySelector('.victory-overlay');
    if (overlay) overlay.remove();
    initGame();
}

/**
 * Auto-move cards to foundation if possible
 */
function autoMoveToFoundation() {
    let moved = true;
    
    while (moved) {
        moved = false;
        
        // Check free cells
        for (let i = 0; i < 4; i++) {
            const card = freeCells[i].peek();
            if (card && canAutoMoveToFoundation(card)) {
                const foundIndex = SUITS.indexOf(card.suit);
                freeCells[i].pop();
                foundations[foundIndex].push(card);
                score += 100;
                moves++;
                moved = true;
            }
        }
        
        // Check tableau tops
        for (let i = 0; i < 8; i++) {
            const card = tableau[i].peek();
            if (card && canAutoMoveToFoundation(card)) {
                const foundIndex = SUITS.indexOf(card.suit);
                tableau[i].pop();
                foundations[foundIndex].push(card);
                score += 100;
                moves++;
                moved = true;
            }
        }
    }
    
    renderAll();
    checkWin();
}

/**
 * Check if card can be auto-moved to foundation
 */
function canAutoMoveToFoundation(card) {
    const foundIndex = SUITS.indexOf(card.suit);
    const foundation = foundations[foundIndex];
    const top = foundation.peek();
    
    if (top) {
        return card.value === top.value + 1;
    } else {
        return card.value === 1; // Ace
    }
}

/**
 * Timer functions
 */
function startTimer() {
    seconds = 0;
    timerEl.textContent = '00:00';
    
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update display
 */
function updateDisplay() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    
    // Update foundation count
    let foundCount = 0;
    for (const found of foundations) {
        foundCount += found.size();
    }
    document.getElementById('found-count').textContent = foundCount;
}

// Event Listeners
newGameBtn.addEventListener('click', initGame);

// Hint button
document.getElementById('hint-btn').addEventListener('click', showHint);

// Click outside to deselect
document.addEventListener('click', (e) => {
    if (!e.target.closest('.card') && 
        !e.target.closest('.column') && 
        !e.target.closest('.free-cell') && 
        !e.target.closest('.foundation')) {
        clearSelection();
    }
});

// Mouse move and up for drag and drop
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);

/**
 * Handle drag start
 */
function handleDragStart(e, sourceType, sourceIndex, cardIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if card can be moved
    if (sourceType === 'tableau') {
        const cards = tableau[sourceIndex].toArray();
        if (cardIndex !== cards.length - 1) {
            if (!canMoveSequence(sourceIndex, cardIndex)) {
                return;
            }
        }
    }
    
    const card = getCardAt(sourceType, sourceIndex, cardIndex);
    if (!card) return;
    
    // Get cards to drag (for sequences)
    let cardsToDrag = [];
    if (sourceType === 'tableau') {
        const cards = tableau[sourceIndex].toArray();
        for (let i = cardIndex; i < cards.length; i++) {
            cardsToDrag.push(cards[i]);
        }
    } else {
        cardsToDrag.push(card);
    }
    
    // Create floating elements
    const floatingCards = [];
    cardsToDrag.forEach((c, idx) => {
        const el = createCardElement(c);
        el.classList.add('dragging');
        el.style.position = 'fixed';
        el.style.left = (e.clientX - 45) + 'px';
        el.style.top = (e.clientY - 20 + idx * 30) + 'px';
        el.style.zIndex = 1000 + idx;
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);
        floatingCards.push(el);
    });
    
    // Hide original cards
    if (sourceType === 'tableau') {
        const colEl = tableauEl.children[sourceIndex];
        const cardEls = colEl.querySelectorAll('.card');
        for (let i = cardIndex; i < cardEls.length; i++) {
            cardEls[i].style.opacity = '0.3';
        }
    } else if (sourceType === 'freecell') {
        const cellEl = freeCellsEl.children[sourceIndex];
        const cardEl = cellEl.querySelector('.card');
        if (cardEl) cardEl.style.opacity = '0.3';
    }
    
    dragState = {
        sourceType,
        sourceIndex,
        cardIndex,
        cards: cardsToDrag,
        floatingCards,
        offsetX: 45,
        offsetY: 20
    };
}

/**
 * Handle drag move
 */
function handleDragMove(e) {
    if (!dragState) return;
    
    dragState.floatingCards.forEach((el, idx) => {
        el.style.left = (e.clientX - dragState.offsetX) + 'px';
        el.style.top = (e.clientY - dragState.offsetY + idx * 30) + 'px';
    });
}

/**
 * Handle drag end
 */
function handleDragEnd(e) {
    if (!dragState) return;
    
    // Remove floating cards
    dragState.floatingCards.forEach(el => el.remove());
    
    // Find drop target
    const target = document.elementFromPoint(e.clientX, e.clientY);
    let success = false;
    
    if (target) {
        // Check for tableau column
        const colEl = target.closest('.column');
        if (colEl) {
            const targetCol = parseInt(colEl.dataset.col);
            success = tryDragMoveToTableau(targetCol);
        }
        
        // Check for free cell
        const freeCellEl = target.closest('.free-cell');
        if (freeCellEl && !success) {
            const targetIndex = parseInt(freeCellEl.dataset.index);
            success = tryDragMoveToFreeCell(targetIndex);
        }
        
        // Check for foundation
        const foundEl = target.closest('.foundation');
        if (foundEl && !success) {
            const targetIndex = parseInt(foundEl.dataset.index);
            success = tryDragMoveToFoundation(targetIndex);
        }
    }
    
    // Reset opacity of original cards
    renderAll();
    dragState = null;
}

/**
 * Try drag move to tableau
 */
function tryDragMoveToTableau(colIndex) {
    if (!dragState) return false;
    
    const targetStack = tableau[colIndex];
    const targetTop = targetStack.peek();
    const movingCard = dragState.cards[0];
    
    if (targetTop) {
        if (targetTop.getColor() === movingCard.getColor()) return false;
        if (targetTop.value !== movingCard.value + 1) return false;
    }
    
    // Perform move
    performDragMove('tableau', colIndex);
    return true;
}

/**
 * Try drag move to free cell
 */
function tryDragMoveToFreeCell(cellIndex) {
    if (!dragState) return false;
    if (dragState.cards.length > 1) return false; // Only single cards
    if (!freeCells[cellIndex].isEmpty()) return false;
    
    performDragMove('freecell', cellIndex);
    return true;
}

/**
 * Try drag move to foundation
 */
function tryDragMoveToFoundation(foundIndex) {
    if (!dragState) return false;
    if (dragState.cards.length > 1) return false; // Only single cards
    
    const foundation = foundations[foundIndex];
    const foundTop = foundation.peek();
    const targetSuit = SUITS[foundIndex];
    const movingCard = dragState.cards[0];
    
    if (movingCard.suit !== targetSuit) return false;
    
    if (foundTop) {
        if (movingCard.value !== foundTop.value + 1) return false;
    } else {
        if (movingCard.value !== 1) return false;
    }
    
    performDragMove('foundation', foundIndex);
    return true;
}

/**
 * Perform drag move
 */
function performDragMove(targetType, targetIndex) {
    const { sourceType, sourceIndex, cards } = dragState;
    
    // Save state for undo
    saveState();
    
    // Remove cards from source
    if (sourceType === 'tableau') {
        for (let i = 0; i < cards.length; i++) {
            tableau[sourceIndex].pop();
        }
    } else if (sourceType === 'freecell') {
        freeCells[sourceIndex].pop();
    }
    
    // Add cards to target
    if (targetType === 'tableau') {
        for (const card of cards) {
            tableau[targetIndex].push(card);
        }
    } else if (targetType === 'freecell') {
        freeCells[targetIndex].push(cards[0]);
    } else if (targetType === 'foundation') {
        foundations[targetIndex].push(cards[0]);
        score += 100;
    }
    
    moves++;
    checkWinOrAutoComplete();
}

/**
 * Show hint - find a valid move and highlight it
 */
function showHint() {
    clearHint();
    
    const hint = findValidMove();
    if (hint) {
        highlightHint(hint);
    }
}

/**
 * Find a valid move
 */
function findValidMove() {
    // Priority 1: Move to foundation
    for (let i = 0; i < 8; i++) {
        const card = tableau[i].peek();
        if (card) {
            const foundIndex = SUITS.indexOf(card.suit);
            const foundation = foundations[foundIndex];
            const foundTop = foundation.peek();
            
            if (foundTop) {
                if (card.value === foundTop.value + 1) {
                    return { from: { type: 'tableau', index: i }, to: { type: 'foundation', index: foundIndex } };
                }
            } else if (card.value === 1) {
                return { from: { type: 'tableau', index: i }, to: { type: 'foundation', index: foundIndex } };
            }
        }
    }
    
    // Check free cells to foundation
    for (let i = 0; i < 4; i++) {
        const card = freeCells[i].peek();
        if (card) {
            const foundIndex = SUITS.indexOf(card.suit);
            const foundation = foundations[foundIndex];
            const foundTop = foundation.peek();
            
            if (foundTop) {
                if (card.value === foundTop.value + 1) {
                    return { from: { type: 'freecell', index: i }, to: { type: 'foundation', index: foundIndex } };
                }
            } else if (card.value === 1) {
                return { from: { type: 'freecell', index: i }, to: { type: 'foundation', index: foundIndex } };
            }
        }
    }
    
    // Priority 2: Move between tableau columns
    for (let i = 0; i < 8; i++) {
        const card = tableau[i].peek();
        if (card) {
            for (let j = 0; j < 8; j++) {
                if (i === j) continue;
                const targetTop = tableau[j].peek();
                if (targetTop) {
                    if (targetTop.getColor() !== card.getColor() && targetTop.value === card.value + 1) {
                        return { from: { type: 'tableau', index: i }, to: { type: 'tableau', index: j } };
                    }
                }
            }
        }
    }
    
    // Priority 3: Move from free cell to tableau
    for (let i = 0; i < 4; i++) {
        const card = freeCells[i].peek();
        if (card) {
            for (let j = 0; j < 8; j++) {
                const targetTop = tableau[j].peek();
                if (targetTop) {
                    if (targetTop.getColor() !== card.getColor() && targetTop.value === card.value + 1) {
                        return { from: { type: 'freecell', index: i }, to: { type: 'tableau', index: j } };
                    }
                }
            }
        }
    }
    
    // Priority 4: Move to empty column
    for (let i = 0; i < 8; i++) {
        if (tableau[i].isEmpty()) {
            for (let j = 0; j < 8; j++) {
                if (tableau[j].size() > 1) {
                    return { from: { type: 'tableau', index: j }, to: { type: 'tableau', index: i } };
                }
            }
        }
    }
    
    // Priority 5: Move to free cell
    for (let i = 0; i < 4; i++) {
        if (freeCells[i].isEmpty()) {
            for (let j = 0; j < 8; j++) {
                if (tableau[j].size() > 0) {
                    return { from: { type: 'tableau', index: j }, to: { type: 'freecell', index: i } };
                }
            }
        }
    }
    
    return null;
}

/**
 * Highlight hint cards
 */
function highlightHint(hint) {
    // Highlight source
    if (hint.from.type === 'tableau') {
        const colEl = tableauEl.children[hint.from.index];
        const cards = colEl.querySelectorAll('.card');
        if (cards.length > 0) {
            cards[cards.length - 1].classList.add('hint');
        }
    } else if (hint.from.type === 'freecell') {
        const cellEl = freeCellsEl.children[hint.from.index];
        const cardEl = cellEl.querySelector('.card');
        if (cardEl) cardEl.classList.add('hint');
    }
    
    // Highlight target
    if (hint.to.type === 'tableau') {
        const colEl = tableauEl.children[hint.to.index];
        colEl.classList.add('hint-target');
    } else if (hint.to.type === 'freecell') {
        const cellEl = freeCellsEl.children[hint.to.index];
        cellEl.classList.add('hint-target');
    } else if (hint.to.type === 'foundation') {
        const foundEl = foundationsEl.children[hint.to.index];
        foundEl.classList.add('hint-target');
    }
    
    // Clear hint after 2 seconds
    setTimeout(clearHint, 2000);
}

/**
 * Clear hint highlights
 */
function clearHint() {
    document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));
    document.querySelectorAll('.hint-target').forEach(el => el.classList.remove('hint-target'));
}

/**
 * Save current state for undo
 */
function saveState() {
    const state = {
        tableau: tableau.map(stack => stack.toArray().map(card => ({ suit: card.suit, value: card.value }))),
        freeCells: freeCells.map(stack => {
            const card = stack.peek();
            return card ? { suit: card.suit, value: card.value } : null;
        }),
        foundations: foundations.map(stack => stack.toArray().map(card => ({ suit: card.suit, value: card.value }))),
        score: score,
        moves: moves
    };
    
    history.push(state);
    if (history.length > 50) history.shift(); // Limit history size
    if (undoBtn) undoBtn.disabled = false;
}

/**
 * Undo last move
 */
function undo() {
    if (history.length === 0) return;
    
    const state = history.pop();
    
    // Restore tableau
    tableau = [];
    for (let i = 0; i < 8; i++) {
        tableau.push(new Stack());
        state.tableau[i].forEach(cardData => {
            tableau[i].push(new Card(cardData.suit, cardData.value));
        });
    }
    
    // Restore free cells
    freeCells = [];
    for (let i = 0; i < 4; i++) {
        freeCells.push(new Stack(1));
        if (state.freeCells[i]) {
            freeCells[i].push(new Card(state.freeCells[i].suit, state.freeCells[i].value));
        }
    }
    
    // Restore foundations
    foundations = [];
    for (let i = 0; i < 4; i++) {
        foundations.push(new Stack());
        foundations[i].suit = SUITS[i];
        state.foundations[i].forEach(cardData => {
            foundations[i].push(new Card(cardData.suit, cardData.value));
        });
    }
    
    score = state.score;
    moves = state.moves;
    
    if (history.length === 0 && undoBtn) {
        undoBtn.disabled = true;
    }
    
    renderAll();
}

/**
 * Check if auto-complete is possible
 * All cards must be in sorted sequences in tableau (no cards in free cells)
 */
function canAutoComplete() {
    // Check if all free cells are empty
    for (let i = 0; i < 4; i++) {
        if (!freeCells[i].isEmpty()) {
            return false;
        }
    }
    
    // Check if all tableau columns are sorted (descending, alternating colors)
    for (let i = 0; i < 8; i++) {
        const cards = tableau[i].toArray();
        for (let j = 0; j < cards.length - 1; j++) {
            const current = cards[j];
            const next = cards[j + 1];
            
            // Must be descending and alternating colors
            if (current.value !== next.value + 1) return false;
            if (current.getColor() === next.getColor()) return false;
        }
    }
    
    return true;
}

/**
 * Auto-complete: move all cards to foundations automatically
 */
async function autoComplete() {
    isAutoCompleting = true;
    
    let moved = true;
    while (moved) {
        moved = false;
        
        // Find the lowest card that can go to foundation
        for (let col = 0; col < 8; col++) {
            const card = tableau[col].peek();
            if (card) {
                const foundIndex = SUITS.indexOf(card.suit);
                const foundation = foundations[foundIndex];
                const foundTop = foundation.peek();
                
                let canMove = false;
                if (foundTop) {
                    canMove = (card.value === foundTop.value + 1);
                } else {
                    canMove = (card.value === 1);
                }
                
                if (canMove) {
                    tableau[col].pop();
                    foundations[foundIndex].push(card);
                    score += 100;
                    moves++;
                    moved = true;
                    
                    renderAll();
                    await sleep(100); // Animation delay
                    break;
                }
            }
        }
    }
    
    isAutoCompleting = false;
    
    // Check for win
    let totalInFoundations = 0;
    for (const found of foundations) {
        totalInFoundations += found.size();
    }
    
    if (totalInFoundations === 52) {
        stopTimer();
        showVictory();
    }
}

/**
 * Sleep utility for animation
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Event Listeners
newGameBtn.addEventListener('click', initGame);
if (undoBtn) undoBtn.addEventListener('click', undo);
if (hintBtn) hintBtn.addEventListener('click', showHint);

// Initialize game on load
document.addEventListener('DOMContentLoaded', initGame);
