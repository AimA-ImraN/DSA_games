/**
 * Stack class for holding Card objects
 * Used for Tableau, Free cells, and Foundation piles
 */
class Stack {
    constructor(maxSize = Infinity) {
        this.items = [];
        this.top = -1;
        this.maxSize = maxSize;
    }

    push(card) {
        if (this.isFull()) {
            return false;
        }
        this.top++;
        this.items[this.top] = card;
        return true;
    }

    pop() {
        if (this.isEmpty()) {
            return null;
        }
        const card = this.items[this.top];
        this.items[this.top] = undefined;
        this.top--;
        return card;
    }

    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.top];
    }

    isEmpty() {
        return this.top === -1;
    }

    isFull() {
        return this.top >= this.maxSize - 1;
    }

    size() {
        return this.top + 1;
    }

    clear() {
        this.items = [];
        this.top = -1;
    }

    toArray() {
        const arr = [];
        for (let i = 0; i <= this.top; i++) {
            arr.push(this.items[i]);
        }
        return arr;
    }
}
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.id = `${suit}-${value}`;
    }

    getColor() {
        return (this.suit === 'hearts' || this.suit === 'diamonds') ? 'red' : 'black';
    }

    getRank() {
        const ranks = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return ranks[this.value];
    }
    getSymbol() {
        const symbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return symbols[this.suit];
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.createDeck();
    }

    createDeck() {
        this.cards = [];
        for (const suit of this.suits) {
            for (let value = 1; value <= 13; value++) {
                this.cards.push(new Card(suit, value));
            }
        }
    }

    shuffle() {
        //Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }

    deal() {
        if (this.cards.length === 0) {
            return null;
        }
        return this.cards.pop();
    }

    reset() {
        this.createDeck();
        this.shuffle();
    }
}
