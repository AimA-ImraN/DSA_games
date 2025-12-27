// Game Constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SYMBOL = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const COLOR = { hearts: 'red', diamonds: 'red', clubs: 'black', spades: 'black' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

// Utility function to shuffle array
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Game State
let deck = [];
let stock = new Queue();
let waste = new Stack();
let foundations = {};
let tableau = [];
let cardMap = {};
let history = [];
let moves = 0;
let seconds = 0;
let timerInterval = null;

// DOM Elements
const stockEl = document.getElementById('stock');
const stockInner = document.getElementById('stock-inner');
const stockCount = document.getElementById('stockCount');
const wasteArea = document.getElementById('waste-area');
const foundationsEls = document.querySelectorAll('.foundation');
const tableauEl = document.getElementById('tableau');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const newBtn = document.getElementById('newBtn');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');
const foundCountEl = document.getElementById('foundCount');

// Create a standard 52-card deck
function createDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
        faceUp: false,
        id: `${suit}-${rank}`
      });
    }
  }
  return cards;
}

// Build a map of all card locations for quick lookup
function rebuildCardMap() {
  cardMap = {};

  tableau.forEach((list, col) => {
    let cur = list.head;
    while (cur) {
      cardMap[cur.card.id] = { location: 'tableau', col, node: cur, card: cur.card };
      cur = cur.next;
    }
  });

  waste.toArray().forEach((c, i) => {
    cardMap[c.id] = { location: 'waste', index: i, card: c };
  });

  stock.toArray().forEach((c, i) => {
    cardMap[c.id] = { location: 'stock', index: i, card: c };
  });

  SUITS.forEach(suit => {
    (foundations[suit] || new Stack()).toArray().forEach((c, i) => {
      cardMap[c.id] = { location: 'foundation', suit, index: i, card: c };
    });
  });
}

// Create a DOM element for a card
function makeCardNode(card) {
  const el = document.createElement('div');
  el.className = 'card ' + (card.faceUp ? 'face' : 'back');
  if (card.faceUp) {
    if (COLOR[card.suit] === 'red') el.classList.add('red');
    el.innerHTML = `<div class="rank">${card.rank}</div><div class="suit">${SYMBOL[card.suit]}</div>`;
  } else {
    el.innerHTML = '<div style="font-weight:700;color:rgba(255,255,255,0.95);font-size:20px">♠</div>';
  }
  el.ondragstart = () => false;
  return el;
}

// Render the stock pile
function renderStock() {
  stockInner.innerHTML = '';
  stockCount.textContent = stock.size();
  if (stock.size() > 0) {
    const back = document.createElement('div');
    back.className = 'card back';
    back.style.position = 'static';
    back.style.width = '100%';
    back.style.height = '100%';
    back.innerHTML = '<div style="font-weight:800;color:rgba(255,255,255,0.95);font-size:24px">♠</div>';
    stockInner.appendChild(back);
  } else {
    stockInner.innerHTML = '<div class="placeholder"><br><small>⟳</small></div>';
  }
}

// Render the waste pile (ONE CARD DRAW - show only top card)
function renderWaste() {
  wasteArea.innerHTML = '';
  const arr = waste.toArray();
  
  if (arr.length > 0) {
    const card = arr[arr.length - 1];
    const el = makeCardNode(card);
    el.classList.add('waste-face');
    el.style.left = '0px';
    el.style.top = '0px';
    el.dataset.wasteIndex = arr.length - 1;
    el.addEventListener('mousedown', wasteCardMouseDown);
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      tryAutoFoundation(card);
    });
    wasteArea.appendChild(el);
  } else {
    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.style.position = 'absolute';
    ph.style.left = '0';
    ph.style.top = '0';
    ph.textContent = 'Waste';
    wasteArea.appendChild(ph);
  }
}

// Render foundation piles
function renderFoundations() {
  foundationsEls.forEach(el => {
    const suit = el.dataset.suit;
    el.innerHTML = '';
    const stack = foundations[suit];

    if (stack && stack.size() > 0) {
      const top = stack.peek();
      const node = makeCardNode(top);
      node.style.position = 'static';
      el.appendChild(node);
    } else {
      el.innerHTML = `<div class="placeholder">${SYMBOL[suit]}</div>`;
    }

    el.onclick = (e) => {
      e.stopPropagation();
      const arr = waste.toArray();
      if (arr.length === 0) return;
      const topCard = arr[arr.length - 1];
      if (canPlaceOnFoundation(topCard, suit)) {
        pushHistory();
        waste.pop();
        foundations[suit].push(topCard);
        rebuildCardMap();
        moves++;
        renderAll();
        checkWin();
      }
    };
  });
}

// Render all tableau columns
function renderTableau() {
  tableauEl.innerHTML = '';
  tableau.forEach((list, colIdx) => {
    const colNode = document.createElement('div');
    colNode.className = 'column';
    colNode.dataset.col = colIdx;

    if (list.length === 0) {
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.style.position = 'relative';
      ph.textContent = 'K';
      colNode.appendChild(ph);
    }

    let idx = 0;
    let cur = list.head;
    while (cur) {
      const card = cur.card;
      const cardEl = makeCardNode(card);
      cardEl.style.top = (idx * 26) + 'px';
      cardEl.dataset.col = colIdx;
      cardEl.dataset.index = idx;

      if (card.faceUp) {
        cardEl.addEventListener('mousedown', tableauCardMouseDown);
        cardEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          tryAutoFoundation(card);
        });
      }

      colNode.appendChild(cardEl);
      idx++;
      cur = cur.next;
    }

    colNode.onclick = (e) => {
      const arr = waste.toArray();
      if (arr.length) {
        const top = arr[arr.length - 1];
        if (canPlaceOnTableau(top, list)) {
          pushHistory();
          waste.pop();
          list.push(top);
          rebuildCardMap();
          moves++;
          renderAll();
          checkWin();
        }
      }
    };

    tableauEl.appendChild(colNode);
  });
}

// Render all game elements
function renderAll() {
  renderStock();
  renderWaste();
  renderFoundations();
  renderTableau();
  updateMeta();
}

// Drag and Drop State
let dragState = null;

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

// Handle mousedown on waste card
function wasteCardMouseDown(e) {
  e.stopPropagation();
  e.preventDefault();
  const el = e.currentTarget;
  const absoluteIndex = parseInt(el.dataset.wasteIndex, 10);
  if (isNaN(absoluteIndex)) return;
  const arr = waste.toArray();
  const card = arr[absoluteIndex];
  if (!card || !card.faceUp) return;

  const clone = makeCardNode(card);
  clone.classList.add('floating');
  clone.style.left = (e.pageX - 46) + 'px';
  clone.style.top = (e.pageY - 64) + 'px';
  document.body.appendChild(clone);

  dragState = {
    type: 'waste',
    sourceIndex: absoluteIndex,
    sequence: [card],
    nodesDOM: [clone],
    offsetX: e.offsetX,
    offsetY: e.offsetY
  };
  highlightTargets(card);
}

// Handle mousedown on tableau card
function tableauCardMouseDown(e) {
  e.stopPropagation();
  e.preventDefault();
  const nodeEl = e.currentTarget;
  const col = parseInt(nodeEl.dataset.col, 10);
  const index = parseInt(nodeEl.dataset.index, 10);
  const list = tableau[col];

  let cur = list.head;
  let i = 0;
  while (cur && i < index) {
    cur = cur.next;
    i++;
  }

  if (!cur || !cur.card.faceUp) return;

  const seqNodes = [];
  let runner = cur;
  while (runner) {
    seqNodes.push(runner);
    runner = runner.next;
  }

  const doms = seqNodes.map((n, idx) => {
    const c = makeCardNode(n.card);
    c.classList.add('floating');
    c.style.left = (e.pageX - 46) + 'px';
    c.style.top = (e.pageY - 64 + idx * 26) + 'px';
    document.body.appendChild(c);
    return c;
  });

  dragState = {
    type: 'tableau',
    sourceCol: col,
    sourceNode: cur,
    sequenceNodes: seqNodes,
    nodesDOM: doms,
    offsetX: e.offsetX,
    offsetY: e.offsetY
  };

  highlightTargets(seqNodes[0].card);
}

// Handle mouse move during drag
function onMouseMove(e) {
  if (!dragState) return;
  dragState.nodesDOM.forEach((d, idx) => {
    d.style.left = (e.pageX - dragState.offsetX) + 'px';
    d.style.top = (e.pageY - dragState.offsetY + (idx * 26 || 0)) + 'px';
  });
}

// Handle mouse up to complete drag
function onMouseUp(e) {
  if (!dragState) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  let success = false;

  if (el) {
    const colEl = el.closest('.column');
    const fEl = el.closest('.foundation');

    if (colEl) {
      const destCol = parseInt(colEl.dataset.col, 10);
      if (dragState.type === 'waste') {
        const card = dragState.sequence[0];
        if (canPlaceOnTableau(card, tableau[destCol])) {
          pushHistory();
          waste.pop();
          tableau[destCol].push(card);
          rebuildCardMap();
          moves++;
          renderAll();
          success = true;
        }
      } else if (dragState.type === 'tableau') {
        if (canPlaceOnTableau(dragState.sequenceNodes[0].card, tableau[destCol])) {
          pushHistory();
          moveTableauSequenceToTableau(dragState.sourceCol, dragState.sourceNode, destCol);
          success = true;
        }
      }
    } else if (fEl) {
      const suit = fEl.dataset.suit;
      if (dragState.type === 'waste') {
        const card = dragState.sequence[0];
        if (canPlaceOnFoundation(card, suit)) {
          pushHistory();
          waste.pop();
          foundations[suit].push(card);
          rebuildCardMap();
          moves++;
          renderAll();
          success = true;
        }
      } else if (dragState.type === 'tableau' && dragState.sequenceNodes.length === 1) {
        const card = dragState.sequenceNodes[0].card;
        if (canPlaceOnFoundation(card, suit)) {
          pushHistory();
          moveTableauCardToFoundation(dragState.sourceCol, dragState.sourceNode, suit);
          success = true;
        }
      }
    }
  }

  dragState.nodesDOM.forEach(n => n.remove());
  clearHighlights();
  dragState = null;
  if (!success) renderAll();
}

// Highlight valid drop targets
function highlightTargets(card) {
  clearHighlights();
  document.querySelectorAll('.column').forEach(colNode => {
    const idx = parseInt(colNode.dataset.col, 10);
    if (canPlaceOnTableau(card, tableau[idx])) colNode.classList.add('drop-target');
  });
  document.querySelectorAll('.foundation').forEach(f => {
    if (canPlaceOnFoundation(card, f.dataset.suit)) f.classList.add('drop-target');
  });
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}

// Stock click handler (ONE CARD DRAW)
stockEl.addEventListener('click', (e) => {
  e.stopPropagation();
  onStockClick();
});

function onStockClick() {
  if (stock.size() === 0) {
    if (waste.size() === 0) return;
    pushHistory();
    const wasteArr = waste.toArray().reverse();
    stock.clear();
    waste.clear();
    for (const c of wasteArr) {
      c.faceUp = false;
      stock.enqueue(c);
    }
    rebuildCardMap();
    moves++;
    renderAll();
    return;
  }

  pushHistory();
  const card = stock.dequeue();
  card.faceUp = true;
  waste.push(card);
  rebuildCardMap();
  moves++;
  renderAll();
}

// Move a sequence of cards from one tableau column to another
function moveTableauSequenceToTableau(sourceCol, sourceNode, destCol) {
  if (sourceCol === destCol) return;
  const srcList = tableau[sourceCol];
  const seqList = srcList.splitAt(sourceNode);
  tableau[destCol].appendNode(seqList.head);

  if (srcList.tail && !srcList.tail.card.faceUp) {
    srcList.tail.card.faceUp = true;
  }

  rebuildCardMap();
  moves++;
  renderAll();
  checkWin();
}

// Move a single card from tableau to foundation
function moveTableauCardToFoundation(sourceCol, node, suit) {
  const srcList = tableau[sourceCol];
  if (node.next) return;
  const popped = srcList.pop();
  foundations[suit].push(popped.card);

  if (srcList.tail && !srcList.tail.card.faceUp) {
    srcList.tail.card.faceUp = true;
  }

  rebuildCardMap();
  moves++;
  renderAll();
  checkWin();
}

// Check if a card can be placed on a tableau column
function canPlaceOnTableau(card, list) {
  if (!card) return false;
  if (list.length === 0) return card.value === 13; // Only Kings on empty columns
  const top = list.tail.card;
  return COLOR[card.suit] !== COLOR[top.suit] && card.value === top.value - 1;
}

// Check if a card can be placed on a foundation
function canPlaceOnFoundation(card, suit) {
  if (!card) return false;
  if (card.suit !== suit) return false;
  const stack = foundations[suit];
  if (!stack || stack.size() === 0) return card.value === 1; // Must start with Ace
  const top = stack.peek();
  return card.value === top.value + 1;
}

// Try to automatically move a card to foundation (double-click handler)
function tryAutoFoundation(card) {
  for (const suit of SUITS) {
    if (canPlaceOnFoundation(card, suit)) {
      pushHistory();
      const loc = cardMap[card.id];
      if (!loc) return;

      if (loc.location === 'waste') {
        waste.pop();
        foundations[suit].push(card);
        rebuildCardMap();
        moves++;
        renderAll();
        checkWin();
      } else if (loc.location === 'tableau') {
        const colList = tableau[loc.col];
        const node = colList.findNodeById(card.id);
        if (node && !node.next) {
          moveTableauCardToFoundation(loc.col, node, suit);
        }
      }
      return;
    }
  }
}

// Find any legal move for the hint system
function findAnyLegalMove() {
  const wasteArr = waste.toArray();
  const visible = wasteArr.length ? [wasteArr[wasteArr.length - 1]] : [];

  for (const card of visible) {
    for (const suit of SUITS) {
      if (canPlaceOnFoundation(card, suit)) {
        return { from: 'waste', card, type: 'foundation', to: suit };
      }
    }
  }

  for (let col = 0; col < 7; col++) {
    const list = tableau[col];
    if (list.tail) {
      const top = list.tail.card;
      for (const suit of SUITS) {
        if (canPlaceOnFoundation(top, suit)) {
          return { from: 'tableau', card: top, type: 'foundation', to: suit, col };
        }
      }
    }
  }

  for (const card of visible) {
    for (let col = 0; col < 7; col++) {
      if (canPlaceOnTableau(card, tableau[col])) {
        return { from: 'waste', card, type: 'tableau', to: col };
      }
    }
  }

  for (let src = 0; src < 7; src++) {
    let cur = tableau[src].head;
    while (cur) {
      if (cur.card.faceUp) {
        for (let dest = 0; dest < 7; dest++) {
          if (src === dest) continue;
          if (canPlaceOnTableau(cur.card, tableau[dest])) {
            return { from: 'tableau', card: cur.card, type: 'tableau', to: dest, col: src };
          }
        }
      }
      cur = cur.next;
    }
  }

  if (stock.size() > 0) return { from: 'stock', type: 'draw' };
  if (waste.size() > 0 && stock.size() === 0) return { from: 'stock', type: 'recycle' };

  return null;
}

// Hint button handler
hintBtn.addEventListener('click', () => {
  const hint = findAnyLegalMove();
  if (!hint) return alert('No legal moves available.');

  if (hint.type === 'foundation') {
    alert(`Hint: Move ${hint.card.rank}${SYMBOL[hint.card.suit]} to ${SYMBOL[hint.to]} foundation.`);
    const foundEl = document.querySelector(`.foundation[data-suit="${hint.to}"]`);
    if (foundEl) {
      foundEl.classList.add('drop-target');
      setTimeout(() => foundEl.classList.remove('drop-target'), 1600);
    }
  } else if (hint.type === 'tableau') {
    alert(`Hint: Move ${hint.card.rank}${SYMBOL[hint.card.suit]} to column ${hint.to + 1}.`);
    const colEl = document.querySelector(`.column[data-col="${hint.to}"]`);
    if (colEl) {
      colEl.classList.add('drop-target');
      setTimeout(() => colEl.classList.remove('drop-target'), 1600);
    }
  } else if (hint.type === 'draw') {
    alert('Hint: Draw from stock.');
    stockEl.classList.add('drop-target');
    setTimeout(() => stockEl.classList.remove('drop-target'), 1200);
  } else if (hint.type === 'recycle') {
    alert('Hint: Recycle waste back to stock.');
    stockEl.classList.add('drop-target');
    setTimeout(() => stockEl.classList.remove('drop-target'), 1200);
  }
});

// Save game state to history for undo
function pushHistory() {
  const snapshot = {
    stock: stock.toArray().map(c => ({...c})),
    waste: waste.toArray().map(c => ({...c})),
    foundations: Object.fromEntries(SUITS.map(s => [s, foundations[s] ? foundations[s].toArray().map(c => ({...c})) : []])),
    tableau: tableau.map(list => list.toArray().map(c => ({ ...c }))),
    moves,
    seconds
  };
  history.push(snapshot);
  undoBtn.disabled = false;
}

// Restore previous game state
function popHistoryRestore() {
  if (history.length <= 1) return;
  history.pop();
  const prev = history[history.length - 1];
  if (!prev) return;

  stock.clear();
  stock.fromArray(prev.stock || []);
  waste.clear();
  for (const c of (prev.waste || [])) waste.push(c);

  foundations = {};
  for (const s of SUITS) {
    const st = new Stack();
    (prev.foundations[s] || []).forEach(c => st.push(c));
    foundations[s] = st;
  }

  tableau = prev.tableau.map(arr => {
    const list = new LinkedList();
    arr.forEach(card => list.push({ ...card }));
    return list;
  });

  moves = prev.moves || 0;
  seconds = prev.seconds || 0;

  rebuildCardMap();
  renderAll();
}

// Undo button handler
undoBtn.addEventListener('click', () => {
  popHistoryRestore();
});

// Check for win condition
function checkWin() {
  const total = SUITS.reduce((sum, s) => sum + ((foundations[s] && foundations[s].size()) || 0), 0);
  if (total === 52) {
    clearInterval(timerInterval);
    setTimeout(() => {
      const mm = Math.floor(seconds / 60);
      const ss = seconds % 60;
      alert(`🎉 You Won! Time: ${mm}m ${ss}s Moves: ${moves}`);
    }, 200);
  }
}

// Update UI metadata
function updateMeta() {
  movesEl.textContent = moves;
  const totalFound = SUITS.reduce((sum, s) => sum + ((foundations[s] && foundations[s].size()) || 0), 0);
  foundCountEl.textContent = totalFound;
  updateTimer();
}

// Update timer display
function updateTimer() {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  timerEl.textContent = `${mm}:${ss}`;
}

// Initialize a new game
function initGame() {
  deck = shuffle(createDeck());
  stock = new Queue();
  waste = new Stack();
  foundations = {
    hearts: new Stack(),
    diamonds: new Stack(),
    clubs: new Stack(),
    spades: new Stack()
  };
  tableau = [];
  cardMap = {};
  history = [];
  moves = 0;
  seconds = 0;

  // Deal 7 columns with 1, 2, 3, 4, 5, 6, 7 cards
  for (let col = 0; col < 7; col++) {
    const L = new LinkedList();
    for (let r = 0; r <= col; r++) {
      const card = deck.pop();
      card.faceUp = (r === col); // Only the last card is face-up
      L.push(card);
    }
    tableau.push(L);
  }

  // Remaining cards go to stock
  while (deck.length) {
    stock.enqueue(deck.pop());
  }

  rebuildCardMap();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);

  pushHistory();
  renderAll();
}

// New game button handler
newBtn.addEventListener('click', () => {
  if (moves > 0 && !confirm('Start a new game? Progress will be lost.')) return;
  clearInterval(timerInterval);
  initGame();
});

// Start the game when page loads
initGame();