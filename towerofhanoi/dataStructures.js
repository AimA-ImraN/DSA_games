/**
 * Tower of Hanoi - Data Structures
 * Stack class with manual pointer logic (no built-in array methods)
 */

class Stack {
    constructor() {
        this.items = [];
        this.top = -1;
    }

    /**
     * Push an item onto the stack
     * @param {*} item - The item to push
     */
    push(item) {
        this.top++;
        this.items[this.top] = item;
    }

    /**
     * Remove and return the top item from the stack
     * @returns {*} The top item, or undefined if empty
     */
    pop() {
        if (this.isEmpty()) {
            return undefined;
        }
        const item = this.items[this.top];
        this.items.length = this.top;
        this.top--;
        return item;
    }

    /**
     * Return the top item without removing it
     * @returns {*} The top item, or undefined if empty
     */
    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.top];
    }

    /**
     * Check if the stack is empty
     * @returns {boolean} True if empty, false otherwise
     */
    isEmpty() {
        return this.top === -1;
    }

    /**
     * Get the number of items in the stack
     * @returns {number} The size of the stack
     */
    size() {
        return this.top + 1;
    }

    /**
     * Check if a disk value can be placed on this stack
     * Valid if stack is empty OR diskValue is smaller than top disk
     * @param {number} diskValue - The size of the disk to place
     * @returns {boolean} True if the disk can be placed
     */
    canAccept(diskValue) {
        if (this.isEmpty()) {
            return true;
        }
        return diskValue < this.peek();
    }

    /**
     * Get all items as an array (bottom to top)
     * @returns {Array} Copy of the stack items
     */
    toArray() {
        const result = [];
        for (let i = 0; i <= this.top; i++) {
            result[i] = this.items[i];
        }
        return result;
    }

    /**
     * Clear the stack
     */
    clear() {
        this.items = [];
        this.top = -1;
    }
}
