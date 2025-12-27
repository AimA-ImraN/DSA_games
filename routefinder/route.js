/**
 * Route Finder - Main Application Logic
 */

import { nodes, graph, dijkstra } from './data-structures.js';

// Canvas and context
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

// DOM elements
const startSelect = document.getElementById("start");
const endSelect = document.getElementById("end");
const output = document.getElementById("output");

// ============================================
// INITIALIZATION
// ============================================
Object.keys(nodes).forEach(n => {
    startSelect.add(new Option(n, n));
    endSelect.add(new Option(n, n));
});

// Initial render
drawMap();

// ============================================
// RESET MAP
// ============================================
function resetMap() {
    drawMap();
    if (output) {
        output.innerHTML = "Select locations to find the shortest route";
    }
}

// Make resetMap available globally for onclick
window.resetMap = resetMap;

// ============================================
// FIND ROUTE
// ============================================
function findRoute() {
    const start = startSelect.value;
    const end = endSelect.value;

    if (start === end) {
        output.innerHTML = "⚠️ Start and destination must differ";
        return;
    }

    const result = dijkstra(start, end);

    if (result.distance === Infinity) {
        output.innerHTML = "❌ No route found between these locations";
        return;
    }

    // Show highlighted path then animate the car along it
    drawMap(result.path);
    animateCar(result.path);

    output.innerHTML = `<b>Route:</b> ${result.path.join(" → ")}`;
}

// Make findRoute available globally for onclick
window.findRoute = findRoute;

// ============================================
// DRAW MAP
// ============================================
function drawMap(path = [], carPos = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Build set of route edges (undirected) to highlight them
    const routeEdges = new Set();
    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        routeEdges.add(key);
    }

    // Draw roads (each undirected edge once)
    for (let from in graph) {
        for (let to in graph[from]) {
            if (from < to) {
                const key = `${from}|${to}`;
                const isRoute = routeEdges.has(key);
                drawLine(nodes[from], nodes[to], isRoute ? '#22c55e' : '#334155', isRoute ? 6 : 3);
            }
        }
    }

    // Draw nodes as houses with labels
    for (let node in nodes) {
        drawNode(node, nodes[node]);
    }

    // Draw car if position provided
    if (carPos) {
        drawCar(carPos);
    }
}

function drawLine(a, b, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function drawNode(name, pos) {
    const x = pos.x;
    const y = pos.y;
    const size = 22;

    // House body
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(x - size/2, y - size/2 + 6, size, size - 6);

    // Roof
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(x - size/2, y - size/2 + 6);
    ctx.lineTo(x + size/2, y - size/2 + 6);
    ctx.lineTo(x, y - size);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - size - 4);
}

function drawCar(pos) {
    ctx.save();
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ============================================
// CAR ANIMATION
// ============================================
function animateCar(path, callback) {
    if (!path || path.length < 2) return;

    // Build points from node names
    const points = path.map(p => ({ x: nodes[p].x, y: nodes[p].y }));

    // Compute segment lengths
    const segLengths = [];
    let totalLen = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.hypot(dx, dy);
        segLengths.push(len);
        totalLen += len;
    }

    const speed = 120; // pixels per second
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;
        let traveled = elapsed * speed;

        if (traveled >= totalLen) {
            // Finished - draw final frame
            drawMap(path, points[points.length - 1]);
            if (callback) callback();
            return;
        }

        // Find which segment we're on
        let acc = 0;
        let segIdx = 0;
        while (segIdx < segLengths.length && acc + segLengths[segIdx] < traveled) {
            acc += segLengths[segIdx];
            segIdx++;
        }

        // Calculate position on current segment
        const segTravel = traveled - acc;
        const t = segLengths[segIdx] === 0 ? 0 : segTravel / segLengths[segIdx];
        const a = points[segIdx];
        const b = points[segIdx + 1];
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;

        drawMap(path, { x, y });
        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}
