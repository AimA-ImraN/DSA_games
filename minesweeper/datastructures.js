// Custom Queue implementation for BFS
function Queue() {
  this.items = {};
  this.front = 0;
  this.back = 0;
}

Queue.prototype.enqueue = function(item) {
  this.items[this.back] = item;
  this.back++;
};

Queue.prototype.dequeue = function() {
  if (this.isEmpty()) return null;
  var item = this.items[this.front];
  delete this.items[this.front];
  this.front++;
  return item;
};

Queue.prototype.isEmpty = function() {
  return this.front === this.back;
};

// Custom Set implementation
function CustomSet() {
  this.items = {};
  this.count = 0;
}

CustomSet.prototype.add = function(item) {
  if (!this.has(item)) {
    this.items[item] = true;
    this.count++;
  }
};

CustomSet.prototype.has = function(item) {
  return this.items[item] === true;
};

CustomSet.prototype.delete = function(item) {
  if (this.has(item)) {
    delete this.items[item];
    this.count--;
  }
};

CustomSet.prototype.size = function() {
  return this.count;
};