// Node positions for visualization (x, y coordinates on canvas)
export const nodes = {
    A: { x: 100, y: 100 },
    B: { x: 300, y: 80 },
    C: { x: 200, y: 250 },
    D: { x: 450, y: 220 },
    E: { x: 600, y: 350 },
    F: { x: 400, y: 400 }
};

// Graph represented as Adjacency List
// Each key is a node, value is an object of {neighbor: weight}
export const graph = {
    A: { B: 2, C: 7 },
    B: { A: 2, C: 5, D: 3 },
    C: { A: 7, B: 5, D: 8, F: 4 },
    D: { B: 3, C: 8, E: 1 },
    E: { D: 1, F: 2 },
    F: { C: 4, E: 2 }
};

// ============================================
// PRIORITY QUEUE - For Dijkstra's Algorithm
// ============================================
export class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        const item = { element, priority };
        let added = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (item.priority < this.items[i].priority) {
                this.items.splice(i, 0, item);
                added = true;
                break;
            }
        }
        
        if (!added) {
            this.items.push(item);
        }
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift().element;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// ============================================
// DIJKSTRA'S ALGORITHM
// ============================================
export function dijkstra(start, end) {
    const dist = {};
    const prev = {};
    const visited = new Set();

    // Initialize distances to infinity
    Object.keys(graph).forEach(n => {
        dist[n] = Infinity;
        prev[n] = null;
    });

    dist[start] = 0;

    // Process all nodes
    while (visited.size < Object.keys(graph).length) {
        let curr = null;
        let min = Infinity;

        // Find unvisited node with minimum distance
        for (let n in dist) {
            if (!visited.has(n) && dist[n] < min) {
                min = dist[n];
                curr = n;
            }
        }

        // No more reachable unvisited nodes
        if (curr === null || dist[curr] === Infinity) break;

        visited.add(curr);

        // Update distances to neighbors (relaxation)
        for (let neighbor in graph[curr]) {
            if (!visited.has(neighbor)) {
                let newDist = dist[curr] + graph[curr][neighbor];
                if (newDist < dist[neighbor]) {
                    dist[neighbor] = newDist;
                    prev[neighbor] = curr;
                }
            }
        }
    }

    // Reconstruct path
    const path = [];
    let temp = end;
    while (temp) {
        path.unshift(temp);
        temp = prev[temp];
    }

    return { path, distance: dist[end] };
}
