// Shared data structures for Memory Match game
// SYMBOLS array - 8 unique symbols for 16 cards (4x4 grid)
const SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥝', '🍍', '🍑'];

/**
 * Fisher-Yates Shuffle Implementation
 * Manually shuffles an array using a while loop and Math.random()
 * Does NOT use .sort() method
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array (shuffles in place)
 */
function fisherYatesShuffle(array) {
    // Create a copy to avoid mutating the original
    const arr = [...array];
    
    // Start from the last element
    let currentIndex = arr.length;
    
    // While there are elements to shuffle
    while (currentIndex > 0) {
        // Pick a random index from 0 to currentIndex - 1
        const randomIndex = Math.floor(Math.random() * currentIndex);
        
        // Decrease currentIndex
        currentIndex--;
        
        // Swap elements at currentIndex and randomIndex
        const temp = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temp;
    }
    
    return arr;
}

/**
 * CardHashTable Class
 * A simple Hash Table implementation to store card states
 * Uses an object internally for O(1) lookups
 */
class CardHashTable {
    constructor() {
        // Internal storage object
        this.table = {};
        this.size = 0;
    }

    /**
     * Hash function - converts key to string for object property
     * @param {number} key - The card index
     * @returns {string} - The hashed key
     */
    _hash(key) {
        return `card_${key}`;
    }

    /**
     * Set a card's state in the hash table
     * @param {number} cardIndex - The card index (key)
     * @param {Object} value - The card state {symbol, isFlipped, isMatched}
     */
    set(cardIndex, value) {
        const hashedKey = this._hash(cardIndex);
        
        // Check if this is a new entry
        if (!this.table.hasOwnProperty(hashedKey)) {
            this.size++;
        }
        
        this.table[hashedKey] = {
            symbol: value.symbol,
            isFlipped: value.isFlipped || false,
            isMatched: value.isMatched || false
        };
    }

    /**
     * Get a card's state from the hash table
     * @param {number} cardIndex - The card index (key)
     * @returns {Object|null} - The card state or null if not found
     */
    get(cardIndex) {
        const hashedKey = this._hash(cardIndex);
        return this.table[hashedKey] || null;
    }

    /**
     * Update a card's state (partial update)
     * @param {number} cardIndex - The card index (key)
     * @param {Object} updates - The properties to update
     */
    update(cardIndex, updates) {
        const hashedKey = this._hash(cardIndex);
        
        if (this.table.hasOwnProperty(hashedKey)) {
            this.table[hashedKey] = {
                ...this.table[hashedKey],
                ...updates
            };
        }
    }

    /**
     * Check if a card exists in the hash table
     * @param {number} cardIndex - The card index (key)
     * @returns {boolean} - True if card exists
     */
    has(cardIndex) {
        const hashedKey = this._hash(cardIndex);
        return this.table.hasOwnProperty(hashedKey);
    }

    /**
     * Remove a card from the hash table
     * @param {number} cardIndex - The card index (key)
     * @returns {boolean} - True if removed successfully
     */
    remove(cardIndex) {
        const hashedKey = this._hash(cardIndex);
        
        if (this.table.hasOwnProperty(hashedKey)) {
            delete this.table[hashedKey];
            this.size--;
            return true;
        }
        return false;
    }

    /**
     * Clear all entries from the hash table
     */
    clear() {
        this.table = {};
        this.size = 0;
    }

    /**
     * Get all card indices (keys) in the hash table
     * @returns {Array<number>} - Array of card indices
     */
    keys() {
        const keys = [];
        for (const key in this.table) {
            if (this.table.hasOwnProperty(key)) {
                // Extract the number from 'card_X'
                keys.push(parseInt(key.replace('card_', '')));
            }
        }
        return keys;
    }

    /**
     * Get all card states (values) in the hash table
     * @returns {Array<Object>} - Array of card states
     */
    values() {
        const values = [];
        for (const key in this.table) {
            if (this.table.hasOwnProperty(key)) {
                values.push(this.table[key]);
            }
        }
        return values;
    }

    /**
     * Get all entries as [index, state] pairs
     * @returns {Array} - Array of [cardIndex, cardState] pairs
     */
    entries() {
        const entries = [];
        for (const key in this.table) {
            if (this.table.hasOwnProperty(key)) {
                const index = parseInt(key.replace('card_', ''));
                entries.push([index, this.table[key]]);
            }
        }
        return entries;
    }

    /**
     * Check if all cards are matched
     * @returns {boolean} - True if all cards have isMatched: true
     */
    allMatched() {
        for (const key in this.table) {
            if (this.table.hasOwnProperty(key)) {
                if (!this.table[key].isMatched) {
                    return false;
                }
            }
        }
        return this.size > 0; // Make sure there are cards
    }

    /**
     * Count matched cards
     * @returns {number} - Number of matched cards
     */
    countMatched() {
        let count = 0;
        for (const key in this.table) {
            if (this.table.hasOwnProperty(key)) {
                if (this.table[key].isMatched) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Get the total number of cards
     * @returns {number} - Total cards in hash table
     */
    getSize() {
        return this.size;
    }
}

// Export for modular environments (optional)
if (typeof module !== 'undefined') {
    module.exports = { SYMBOLS, fisherYatesShuffle, CardHashTable };
}