/**
 * SudokuBoard Class
 * Stores a 2D Array (9x9) and provides methods for Sudoku game logic
 */
class SudokuBoard {
    constructor() {
        // Initialize 9x9 grid with zeros
        this.grid = [];
        this.originalGrid = [];
        
        for (let i = 0; i < 9; i++) {
            this.grid.push(new Array(9).fill(0));
            this.originalGrid.push(new Array(9).fill(0));
        }
    }

    /**
     * Check if placing a number at (row, col) is valid
     * Checks if num already exists in the specific row, column, or 3x3 box
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} num - Number to check (1-9)
     * @returns {boolean} - True if placement is valid
     */
    isValid(row, col, num) {
        // Check row - manually loop through all columns in this row
        for (let c = 0; c < 9; c++) {
            if (c !== col && this.grid[row][c] === num) {
                return false;
            }
        }

        // Check column - manually loop through all rows in this column
        for (let r = 0; r < 9; r++) {
            if (r !== row && this.grid[r][col] === num) {
                return false;
            }
        }

        // Check 3x3 box
        // Find the top-left corner of the 3x3 box
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;

        // Manually loop through all cells in the 3x3 box
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (r !== row || c !== col) {
                    if (this.grid[r][c] === num) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Find the next empty cell (containing 0)
     * Manually loops through the 2D array
     * @returns {Object|null} - {row, col} of empty cell, or null if board is full
     */
    findEmpty() {
        // Manually loop through all rows
        for (let row = 0; row < 9; row++) {
            // Manually loop through all columns in this row
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    return { row, col };
                }
            }
        }
        return null; // No empty cell found - board is complete
    }

    /**
     * Set value at specific cell
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} value - Value to set (0-9, 0 means empty)
     */
    setValue(row, col, value) {
        this.grid[row][col] = value;
    }

    /**
     * Get value at specific cell
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @returns {number} - Value at the cell
     */
    getValue(row, col) {
        return this.grid[row][col];
    }

    /**
     * Clear the entire grid (set all cells to 0)
     */
    clear() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.grid[row][col] = 0;
            }
        }
    }

    /**
     * Create a deep copy of the current grid
     * @returns {number[][]} - Copy of the grid
     */
    copyGrid() {
        const copy = [];
        for (let row = 0; row < 9; row++) {
            copy.push([]);
            for (let col = 0; col < 9; col++) {
                copy[row].push(this.grid[row][col]);
            }
        }
        return copy;
    }

    /**
     * Load a grid into the board
     * @param {number[][]} gridData - 2D array to load
     */
    loadGrid(gridData) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.grid[row][col] = gridData[row][col];
            }
        }
    }

    /**
     * Save current grid as the original puzzle
     * Original cells cannot be edited by the player
     */
    saveAsOriginal() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.originalGrid[row][col] = this.grid[row][col];
            }
        }
    }

    /**
     * Check if a cell is an original (given) cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} - True if cell is part of original puzzle
     */
    isOriginal(row, col) {
        return this.originalGrid[row][col] !== 0;
    }

    /**
     * Reset board to original puzzle state
     */
    resetToOriginal() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.grid[row][col] = this.originalGrid[row][col];
            }
        }
    }

    /**
     * Check if the board is completely filled
     * @returns {boolean} - True if no empty cells
     */
    isFull() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Check if the board is complete and valid
     * @returns {boolean} - True if board is fully solved correctly
     */
    isComplete() {
        if (!this.isFull()) {
            return false;
        }

        // Check all rows, columns, and boxes for validity
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const num = this.grid[row][col];
                // Temporarily clear the cell to check if the number is valid
                this.grid[row][col] = 0;
                const valid = this.isValid(row, col, num);
                this.grid[row][col] = num;
                
                if (!valid) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get all cells with conflicts (invalid placements)
     * @returns {Array} - Array of {row, col} objects with conflicts
     */
    getConflicts() {
        const conflicts = [];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const num = this.grid[row][col];
                if (num !== 0) {
                    // Temporarily clear to check validity
                    this.grid[row][col] = 0;
                    if (!this.isValid(row, col, num)) {
                        conflicts.push({ row, col });
                    }
                    this.grid[row][col] = num;
                }
            }
        }

        return conflicts;
    }

    /**
     * Get a hint - find an empty cell and return its correct value
     * @param {number[][]} solution - The complete solution grid
     * @returns {Object|null} - {row, col, value} or null if no empty cells
     */
    getHint(solution) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    return {
                        row,
                        col,
                        value: solution[row][col]
                    };
                }
            }
        }
        return null;
    }

    /**
     * Count empty cells
     * @returns {number} - Number of empty cells
     */
    countEmpty() {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Get the grid as a string (for debugging)
     * @returns {string} - String representation of the grid
     */
    toString() {
        let result = '';
        for (let row = 0; row < 9; row++) {
            if (row % 3 === 0 && row !== 0) {
                result += '------+-------+------\n';
            }
            for (let col = 0; col < 9; col++) {
                if (col % 3 === 0 && col !== 0) {
                    result += '| ';
                }
                const val = this.grid[row][col];
                result += (val === 0 ? '.' : val) + ' ';
            }
            result += '\n';
        }
        return result;
    }
}
