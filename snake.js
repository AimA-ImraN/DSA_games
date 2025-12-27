// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

// Game state
let snake;               // Doubly Linked List for snake body
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let highScore = 0;
let gameState = 'waiting'; // 'waiting', 'playing', 'paused', 'gameover'
let gameLoop = null;
let speed = INITIAL_SPEED;

// Canvas and context
let canvas, ctx;

// DOM Elements
let overlay, overlayTitle, overlayMessage, overlayStats, replayBtn;
let scoreEl, lengthEl, highScoreEl, finalScoreEl, finalLengthEl;
let pauseBtn;

/**
 * Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    // Get DOM elements
    overlay = document.getElementById('gameOverlay');
    overlayTitle = document.getElementById('overlayTitle');
    overlayMessage = document.getElementById('overlayMessage');
    overlayStats = document.getElementById('overlayStats');
    replayBtn = document.getElementById('replayBtn');
    scoreEl = document.getElementById('score');
    lengthEl = document.getElementById('length');
    highScoreEl = document.getElementById('highScore');
    finalScoreEl = document.getElementById('finalScore');
    finalLengthEl = document.getElementById('finalLength');
    pauseBtn = document.getElementById('pauseBtn');
    
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    highScoreEl.textContent = highScore;
    
    // Initialize snake
    initSnake();
    
    // Draw initial state
    draw();
    
    // Show start overlay
    showOverlay('start');
    
    // Event listeners
    document.getElementById('newBtn').addEventListener('click', startNewGame);
    replayBtn.addEventListener('click', startNewGame);
    pauseBtn.addEventListener('click', togglePause);
    document.addEventListener('keydown', handleKeyDown);
});

/**
 * Initialize/reset the snake using Doubly Linked List
 */
function initSnake() {
    snake = new LinkedList();
    
    // Add initial segments (3 nodes)
    // Start in middle, going right
    snake.addAtHead(7, 10);  // Tail
    snake.addAtHead(8, 10);  // Middle
    snake.addAtHead(9, 10);  // Head
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    
    placeFood();
    updateHUD();
}

/**
 * Start a new game
 */
function startNewGame() {
    hideOverlay();
    initSnake();
    gameState = 'playing';
    
    // Clear existing loop
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    // Start game loop using setInterval
    gameLoop = setInterval(update, speed);
}

/**
 * Main game update loop
 */
function update() {
    if (gameState !== 'playing') return;
    
    // Update direction
    direction = { ...nextDirection };
    
    // Calculate new head position
    const head = snake.getHead();
    const newX = head.x + direction.x;
    const newY = head.y + direction.y;
    
    // Check wall collision
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        gameOver();
        return;
    }
    
    // Check self collision (loop through linked list nodes)
    if (snake.checkCollision(newX, newY, false)) {
        gameOver();
        return;
    }
    
    // Add new head at new position
    snake.addAtHead(newX, newY);
    
    // Check if food is eaten
    if (newX === food.x && newY === food.y) {
        // Snake grows - don't remove tail
        score += 10;
        placeFood();
        
        // Increase speed every 50 points
        if (score % 50 === 0 && speed > 60) {
            speed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, speed);
        }
    } else {
        // Remove tail (snake moves without growing)
        snake.removeTail();
    }
    
    updateHUD();
    draw();
}

/**
 * Draw the game state
 */
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a2f47';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // Draw food (red apple)
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    
    // Apple body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(foodX, foodY + 2, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple stem
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(foodX, foodY - 5);
    ctx.lineTo(foodX + 2, foodY - 9);
    ctx.stroke();
    
    // Apple leaf
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(foodX + 4, foodY - 7, 3, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw snake using linked list toArray
    const snakeBody = snake.toArray();
    snakeBody.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        
        if (index === 0) {
            // Head - brighter color with eyes
            ctx.fillStyle = '#22c55e';
            
            // Rounded head
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#fff';
            const eyeSize = 4;
            
            if (direction.x === 1) { // Right
                ctx.beginPath();
                ctx.arc(x + 14, y + 6, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + 14, y + 14, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(x + 15, y + 6, 2, 0, Math.PI * 2);
                ctx.arc(x + 15, y + 14, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.x === -1) { // Left
                ctx.beginPath();
                ctx.arc(x + 6, y + 6, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + 6, y + 14, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(x + 5, y + 6, 2, 0, Math.PI * 2);
                ctx.arc(x + 5, y + 14, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === -1) { // Up
                ctx.beginPath();
                ctx.arc(x + 6, y + 6, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + 14, y + 6, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(x + 6, y + 5, 2, 0, Math.PI * 2);
                ctx.arc(x + 14, y + 5, 2, 0, Math.PI * 2);
                ctx.fill();
            } else { // Down
                ctx.beginPath();
                ctx.arc(x + 6, y + 14, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + 14, y + 14, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(x + 6, y + 15, 2, 0, Math.PI * 2);
                ctx.arc(x + 14, y + 15, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Body segments - gradient from bright to darker
            const intensity = Math.max(0.5, 1 - (index * 0.03));
            ctx.fillStyle = `rgba(74, 222, 128, ${intensity})`;
            
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
            ctx.fill();
        }
    });
}

/**
 * Place food at random position not on snake
 */
function placeFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
        
        // Check if food is not on snake (using linked list method)
        if (!snake.checkCollision(food.x, food.y, false)) {
            validPosition = true;
        }
    }
}

/**
 * Update the HUD display
 */
function updateHUD() {
    scoreEl.textContent = score;
    lengthEl.textContent = snake.getSize();
}

/**
 * Handle game over
 */
function gameOver() {
    gameState = 'gameover';
    clearInterval(gameLoop);
    gameLoop = null;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    // Show game over overlay
    showOverlay('gameover');
}

/**
 * Toggle pause state
 */
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        clearInterval(gameLoop);
        gameLoop = null;
        pauseBtn.textContent = 'Resume';
        showOverlay('paused');
    } else if (gameState === 'paused') {
        hideOverlay();
        gameState = 'playing';
        pauseBtn.textContent = 'Pause';
        gameLoop = setInterval(update, speed);
    }
}

/**
 * Show overlay with different states
 */
function showOverlay(state) {
    overlay.classList.remove('hidden');
    
    switch (state) {
        case 'start':
            overlayTitle.textContent = '🐍 Snake Game';
            overlayMessage.textContent = 'Press ENTER to Start';
            overlayStats.style.display = 'none';
            replayBtn.textContent = '▶ Play';
            break;
        case 'gameover':
            overlayTitle.textContent = '💀 Game Over';
            overlayMessage.textContent = score > highScore - 10 ? 'New High Score!' : 'Try Again!';
            overlayStats.style.display = 'flex';
            finalScoreEl.textContent = score;
            finalLengthEl.textContent = snake.getSize();
            replayBtn.textContent = '↻ Replay';
            break;
        case 'paused':
            overlayTitle.textContent = '⏸️ Paused';
            overlayMessage.textContent = 'Press P or click Resume to continue';
            overlayStats.style.display = 'none';
            replayBtn.textContent = '▶ Resume';
            break;
    }
}

/**
 * Hide overlay
 */
function hideOverlay() {
    overlay.classList.add('hidden');
}

/**
 * Handle keyboard input
 */
function handleKeyDown(e) {
    switch (e.key) {
        case 'Enter':
            if (gameState === 'waiting' || gameState === 'gameover') {
                startNewGame();
            } else if (gameState === 'paused') {
                togglePause();
            }
            e.preventDefault();
            break;
            
        case 'ArrowUp':
            if (direction.y === 0 && gameState === 'playing') {
                nextDirection = { x: 0, y: -1 };
            }
            e.preventDefault();
            break;
            
        case 'ArrowDown':
            if (direction.y === 0 && gameState === 'playing') {
                nextDirection = { x: 0, y: 1 };
            }
            e.preventDefault();
            break;
            
        case 'ArrowLeft':
            if (direction.x === 0 && gameState === 'playing') {
                nextDirection = { x: -1, y: 0 };
            }
            e.preventDefault();
            break;
            
        case 'ArrowRight':
            if (direction.x === 0 && gameState === 'playing') {
                nextDirection = { x: 1, y: 0 };
            }
            e.preventDefault();
            break;
            
        case 'p':
        case 'P':
            if (gameState === 'playing' || gameState === 'paused') {
                togglePause();
            }
            e.preventDefault();
            break;
            
        case ' ':
            if (gameState === 'gameover') {
                startNewGame();
            }
            e.preventDefault();
            break;
    }
}
