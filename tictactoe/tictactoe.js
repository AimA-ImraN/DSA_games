let playerO = "O";
let playerX = "X";
let currPlayer = playerO;

//               0   1   2   3   4   5   6   7   8
let gameBoard = ["", "", "", "", "", "", "", "", ""];
let gameCells;  //array of div cells with indices 0-8

let winningConditions = [
    [0, 1, 2], //horizontal row 1
    [3, 4, 5], //horizontal row 2
    [6, 7, 8], //horizontal row 3
    [0, 3, 6], //vertical column 1
    [1, 4, 7], //vertical column 2
    [2, 5, 8], //vertical column 3
    [0, 4, 8], //diagonal
    [2, 4, 6]  //anti-diagonal
];

let gameOver = false;

// Score tracking
let scoreO = 0;
let scoreX = 0;
let scoreDraw = 0;

window.onload = function() {
    gameCells = document.getElementsByClassName("game-cell");
    for (let cell of gameCells) {
        cell.addEventListener("click", placeCell);
    }
    
    // Button event listeners
    document.getElementById("new-game-btn").addEventListener("click", restartGame);
    document.getElementById("restart-btn").addEventListener("click", function() {
        document.getElementById("game-over-overlay").classList.remove("active");
        restartGame();
    });
    
    updateUI();
    updateTurnIndicator();
}

function updateUI() {
    document.getElementById("score-o").textContent = scoreO;
    document.getElementById("score-x").textContent = scoreX;
    document.getElementById("score-draw").textContent = scoreDraw;
}

function updateTurnIndicator() {
    const indicator = document.getElementById("turn-indicator");
    indicator.textContent = `Player ${currPlayer}'s Turn`;
    indicator.className = "turn-indicator";
    indicator.classList.add(currPlayer === playerO ? "player-o" : "player-x");
}

function placeCell() {
    if (gameOver) {
        return;
    }

    const index = parseInt(this.getAttribute("data-cell-index"));
    if (gameBoard[index] !== "") {
        return;
    }

    gameBoard[index] = currPlayer; //mark the board
    this.innerText = currPlayer;   //mark the board on html
    this.classList.add(currPlayer === playerO ? "player-o" : "player-x");

    //check winner before changing player
    if (checkWinner()) {
        return;
    }
    
    //check for draw
    if (checkDraw()) {
        return;
    }

    //change players
    currPlayer = (currPlayer == playerO) ? playerX : playerO;
    updateTurnIndicator();
}

function checkWinner() {
    for (let winCondition of winningConditions) {
        let a = gameBoard[winCondition[0]];
        let b = gameBoard[winCondition[1]];
        let c = gameBoard[winCondition[2]];

        if (a == b && b == c && a != "") {
            //update styling for winning cells
            for (let i = 0; i < gameBoard.length; i++) {
                if (winCondition.includes(i)) {
                    gameCells[i].classList.add("winning-game-cell");
                }
            }
            
            // Update score
            if (currPlayer === playerO) {
                scoreO++;
            } else {
                scoreX++;
            }
            updateUI();
            
            // Show game over
            showGameOver(currPlayer);
            gameOver = true;
            return true;
        }
    }
    return false;
}

function checkDraw() {
    if (!gameBoard.includes("")) {
        scoreDraw++;
        updateUI();
        showGameOver(null); // null means draw
        gameOver = true;
        return true;
    }
    return false;
}

function showGameOver(winner) {
    const overlay = document.getElementById("game-over-overlay");
    const title = document.getElementById("game-over-title");
    const message = document.getElementById("game-over-message");
    
    if (winner === null) {
        title.textContent = "IT'S A DRAW!";
        title.className = "game-over-title draw";
        message.textContent = "No winner this time.";
    } else {
        title.textContent = `PLAYER ${winner} WINS!`;
        title.className = "game-over-title";
        title.classList.add(winner === playerO ? "player-o" : "player-x");
        message.textContent = "Congratulations!";
    }
    
    overlay.classList.add("active");
}

function restartGame() {
    gameOver = false;
    currPlayer = playerO;
    gameBoard = ["", "", "", "", "", "", "", "", ""];
    for (let cell of gameCells) {
        cell.innerText = "";
        cell.classList.remove("winning-game-cell", "player-o", "player-x");
    }
    updateTurnIndicator();
}    