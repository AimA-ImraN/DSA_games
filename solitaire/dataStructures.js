class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

class Stack {
  constructor() {
    this.top = null;
    this.bottom = null;
    this._size = 0;
  }

  push(value) {
    const node = new Node(value);
    if (!this.top) {
      this.top = this.bottom = node;
    } else {
      node.prev = this.top;
      this.top.next = node;
      this.top = node;
    }
    this._size++;
  }
  pop() {
    if (!this.top) return null;
    const node = this.top;
    if (this.top === this.bottom) {
      this.top = this.bottom = null;
    } else {
      this.top = node.prev;
      this.top.next = null;
    }
    node.prev = node.next = null;
    this._size--;
    return node.value;
  }
  peek() {
    return this.top ? this.top.value : null;
  }
  isEmpty() {
    return this._size === 0;
  }
  size() {
    return this._size;
  }
  toArray() {
    const arr = [];
    let cur = this.bottom;
    while (cur) {
      arr.push(cur.value);
      cur = cur.next;
    }
    return arr;
  }
  clear() {
    this.top = this.bottom = null;
    this._size = 0;
  }
}


class Queue {
  constructor() {
    this.head = null; // front
    this.tail = null; // back
    this._size = 0;
  }
  enqueue(value) {
    const node = new Node(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this._size++;
  }
  dequeue() {
    if (!this.head) return null;
    const node = this.head;
    if (this.head === this.tail) {
      this.head = this.tail = null;
    } else {
      this.head = node.next;
      this.head.prev = null;
    }
    node.next = node.prev = null;
    this._size--;
    return node.value;
  }
  peek() {
    return this.head ? this.head.value : null;
  }
  isEmpty() {
    return this._size === 0;
  }
  size() {
    return this._size;
  }
  toArray() {
    const arr = [];
    let cur = this.head;
    while (cur) {
      arr.push(cur.value);
      cur = cur.next;
    }
    return arr;
  }
  clear() {
    this.head = this.tail = null;
    this._size = 0;
  }
  fromArray(arr) {
    this.clear();
    for (const v of arr) this.enqueue(v);
  }
}

class ListNode {
  constructor(card) {
    this.card = card;
    this.next = null;
    this.prev = null;
  }
}
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  push(card) {
    const node = new ListNode(card);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this.length++;
    return node;
  }
  pop() {
    if (!this.tail) return null;
    const node = this.tail;
    if (this.head === this.tail) {
      this.head = this.tail = null;
      this.length = 0;
    } else {
      this.tail = node.prev;
      this.tail.next = null;
      this.length--;
    }
    node.prev = node.next = null;
    return node;
  }
  appendNode(node) {
    if (!node) return;
    // find tail of incoming sequence
    let seqTail = node;
    let count = 1;
    while (seqTail.next) {
      seqTail = seqTail.next;
      count++;
    }
    if (!this.tail) {
      this.head = node;
      node.prev = null;
      this.tail = seqTail;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = seqTail;
    }
    this.length += count;
  }
  splitAt(node) {
    if (!node) return new LinkedList();
    const newList = new LinkedList();
    newList.head = node;
    let tailNode = node;
    let count = 1;
    while (tailNode.next) {
      tailNode = tailNode.next;
      count++;
    }
    newList.tail = tailNode;
    newList.length = count;

    if (node.prev) {
      node.prev.next = null;
      this.tail = node.prev;
      node.prev = null;
    } else {
      this.head = null;
      this.tail = null;
      this.length = 0;
      return newList;
    }
    let cur = this.head;
    let l = 0;
    while (cur) {
      l++;
      cur = cur.next;
    }
    this.length = l;
    return newList;
  }
  toArray() {
    const arr = [];
    let cur = this.head;
    while (cur) {
      arr.push(cur.card);
      cur = cur.next;
    }
    return arr;
  }
  findNodeById(id) {
    let cur = this.head;
    while (cur) {
      if (cur.card.id === id) return cur;
      cur = cur.next;
    }
    return null;
  }
}