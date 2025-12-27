/**
 * Stack class for Water Sort game
 * Represents a tube that can hold up to 4 color elements
 */
class Stack {
    constructor(maxSize = 4) {
        this.items = [];
        this.maxSize = maxSize;
    }

    /**
     * Push a color onto the stack
     * @param {string} color - The color to add
     * @returns {boolean} - True if successful, false if full
     */
    push(color) {
        if (this.isFull()) {
            return false;
        }
        this.items.push(color);
        return true;
    }

    /**
     * Remove and return the top color
     * @returns {string|null} - The top color or null if empty
     */
    pop() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.pop();
    }

    /**
     * View the top color without removing it
     * @returns {string|null} - The top color or null if empty
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.items.length - 1];
    }

    /**
     * Check if stack is full
     * @returns {boolean}
     */
    isFull() {
        return this.items.length >= this.maxSize;
    }

    /**
     * Check if stack is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Get current size of stack
     * @returns {number}
     */
    size() {
        return this.items.length;
    }

    /**
     * Check if all elements in the stack match (same color)
     * @returns {boolean} - True if all elements are the same color
     */
    allElementsMatch() {
        if (this.isEmpty()) {
            return false; // Empty stack doesn't count as sorted
        }
        
        const firstColor = this.items[0];
        for (let i = 1; i < this.items.length; i++) {
            if (this.items[i] !== firstColor) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if stack is complete (full and all same color)
     * @returns {boolean}
     */
    isComplete() {
        return this.isFull() && this.allElementsMatch();
    }

    /**
     * Get all items as array (bottom to top)
     * @returns {Array}
     */
    toArray() {
        return [...this.items];
    }

    /**
     * Clear the stack
     */
    clear() {
        this.items = [];
    }

    /**
     * Count consecutive matching colors from top
     * @returns {number}
     */
    getTopMatchCount() {
        if (this.isEmpty()) return 0;
        
        let count = 1;
        const topColor = this.peek();
        
        for (let i = this.items.length - 2; i >= 0; i--) {
            if (this.items[i] === topColor) {
                count++;
            } else {
                break;
            }
        }
        
        return count;
    }
}
