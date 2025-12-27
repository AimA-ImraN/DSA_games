/**
 * Node class for Doubly Linked List
 * Each node stores x, y coordinates for snake position
 */
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.next = null;  // Pointer to next node (towards tail)
        this.prev = null;  // Pointer to previous node (towards head)
    }
}

/**
 * Doubly Linked List class for Snake body
 * The head represents the snake's head, tail represents the end
 */
class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Add a new node at the head (front) of the list
     * Used when the snake moves forward
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Node} - The newly added node
     */
    addAtHead(x, y) {
        const newNode = new Node(x, y);
        
        if (this.head === null) {
            // List is empty - new node becomes both head and tail
            this.head = newNode;
            this.tail = newNode;
        } else {
            // Link new node to current head
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }
        
        this.size++;
        return newNode;
    }

    /**
     * Remove the tail node from the list
     * Used when the snake moves and doesn't eat food
     * @returns {Node|null} - The removed node or null if empty
     */
    removeTail() {
        if (this.tail === null) {
            return null; // Empty list
        }

        const removedNode = this.tail;

        if (this.head === this.tail) {
            // Only one node in list
            this.head = null;
            this.tail = null;
        } else {
            // Move tail pointer to previous node
            this.tail = this.tail.prev;
            this.tail.next = null;
            removedNode.prev = null;
        }

        this.size--;
        return removedNode;
    }

    /**
     * Convert linked list to array for rendering
     * @returns {Array} - Array of {x, y} objects
     */
    toArray() {
        const result = [];
        let current = this.head;
        
        while (current !== null) {
            result.push({ x: current.x, y: current.y });
            current = current.next;
        }
        
        return result;
    }

    /**
     * Check if a position collides with any node in the list
     * Manually loops through nodes using pointers
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @param {boolean} skipHead - Whether to skip the head node
     * @returns {boolean} - True if collision detected
     */
    checkCollision(x, y, skipHead = false) {
        let current = skipHead ? this.head.next : this.head;
        
        while (current !== null) {
            if (current.x === x && current.y === y) {
                return true;
            }
            current = current.next;
        }
        
        return false;
    }

    /**
     * Get the head node's position
     * @returns {Object|null} - {x, y} object or null if empty
     */
    getHead() {
        return this.head ? { x: this.head.x, y: this.head.y } : null;
    }

    /**
     * Clear all nodes from the list
     */
    clear() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Get the length of the snake
     * @returns {number} - Number of nodes
     */
    getSize() {
        return this.size;
    }
}
