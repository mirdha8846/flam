// --- 1. Math Utilities ---

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y); // Immutable
    }
    
    // In-place add for physics performance
    addClass(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    mult(s) {
        return new Vector2(this.x * s, this.y * s);
    }
    
    // In-place mult
    multScalar(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const m = this.mag();
        if (m === 0) return new Vector2(0, 0);
        return new Vector2(this.x / m, this.y / m);
    }

    dist(v) {
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    }
}

// --- 2. Physics Engine ---

class SpringPoint {
    constructor(x, y, stiffness = 0.1, damping = 0.8) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.stiffness = stiffness; // k
        this.damping = damping;
    }

    update(targetPos) {
        // F = -k * (pos - target)
        // a = F (assuming mass = 1)
        const force = targetPos.sub(this.pos).mult(this.stiffness);
        
        // Apply force to velocity
        this.vel.addClass(force);
        
        // Apply damping
        this.vel.multScalar(this.damping);
        
        // Update position
        this.pos.addClass(this.vel);
    }
}

// --- 3. App State & Logic ---

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
// Interaction Target (Mouse influence)
let mousePos = new Vector2(0, 0);
let targetP1 = new Vector2(0, 0);
let targetP2 = new Vector2(0, 0);

// Control Points
let P0, P3; // Fixed anchors
let P1, P2; // Physics points

// Drag State
let draggingPoint = null;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Reset positions on resize
    const midY = height / 2;
    const margin = width * 0.2;
    
    P0 = new Vector2(margin, midY);
    P3 = new Vector2(width - margin, midY);
    
    // Initialize Physics Points
    // They start at rest positions (1/3 and 2/3 of the way)
    const span = width - 2 * margin;
    P1 = new SpringPoint(margin + span * 0.33, midY, 0.05, 0.92);
    P2 = new SpringPoint(margin + span * 0.66, midY, 0.05, 0.92);

    targetP1 = new Vector2(margin + span * 0.33, midY);
    targetP2 = new Vector2(margin + span * 0.66, midY);
}

// --- 4. Motion Logic ---

function updatePhysics() {
    
    const midY = height / 2;
    const margin = width * 0.2;
    const span = width - 2 * margin;
    
    const restP1 = new Vector2(margin + span * 0.33, midY);
    const restP2 = new Vector2(margin + span * 0.66, midY);
    
    // Logic:
    // If dragging a point, its target is the mouse.
    // If NOT dragging, target is rest position (spring back).
    
    if (draggingPoint === P1) {
        targetP1 = mousePos; 
    } else {
        targetP1 = restP1;
    }

    if (draggingPoint === P2) {
        targetP2 = mousePos;
    } else {
        targetP2 = restP2;
    }
    
    P1.update(targetP1);
    P2.update(targetP2);
}

// --- 5. Bezier Math ---

// Calculate Point B(t)
function getBezierPoint(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    // (1-t)^3 * P0
    const term0 = p0.mult(mt3);
    // 3 * (1-t)^2 * t * P1
    const term1 = p1.mult(3 * mt2 * t);
    // 3 * (1-t) * t^2 * P2
    const term2 = p2.mult(3 * mt * t2);
    // t^3 * P3
    const term3 = p3.mult(t3);

    return term0.add(term1).add(term2).add(term3);
}

// Calculate Tangent B'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)
function getBezierTangent(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    // 3(1-t)^2 * (P1 - P0)
    const v1 = p1.sub(p0).mult(3 * mt2);
    // 6(1-t)t * (P2 - P1)
    const v2 = p2.sub(p1).mult(6 * mt * t);
    // 3t^2 * (P3 - P2)
    const v3 = p3.sub(p2).mult(3 * t2);

    return v1.add(v2).add(v3).normalize();
}

// --- 6. Rendering ---

function draw() {
    // Clear
    ctx.fillStyle = '#0d0d12';
    // ctx.clearRect(0, 0, width, height); // ClearRect is faster but fillStyle handles bg
    ctx.fillRect(0, 0, width, height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
    for(let y=0; y<height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
    ctx.stroke();

    // 1. Draw "String" (The curve)
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    
    // Sampling
    const step = 0.01;
    let first = true;
    for (let t = 0; t <= 1.0; t += step) {
        let p = getBezierPoint(t, P0, P1.pos, P2.pos, P3);
        if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
        } else {
            ctx.lineTo(p.x, p.y);
        }
    }
    // Ensure we hit the last point exactly
    ctx.lineTo(P3.x, P3.y);
    ctx.stroke();
    
    // Reset Shadow
    ctx.shadowBlur = 0;

    // 2. Draw Tangents (Visual cues defined in reqs)
    ctx.strokeStyle = '#ff00de';
    ctx.lineWidth = 2;
    const tangentInterval = 0.1;
    for (let t = 0; t <= 1.0; t += tangentInterval) {
        let p = getBezierPoint(t, P0, P1.pos, P2.pos, P3);
        let tan = getBezierTangent(t, P0, P1.pos, P2.pos, P3);
        
        // Draw a small line in direction of tangent
        const tanLen = 20;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + tan.x * tanLen, p.y + tan.y * tanLen);
        ctx.stroke();
    }

    // 3. Draw Control Structure (Debug visual)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(P0.x, P0.y);
    ctx.lineTo(P1.pos.x, P1.pos.y);
    ctx.lineTo(P2.pos.x, P2.pos.y);
    ctx.lineTo(P3.x, P3.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Points
    drawPoint(P0, '#fff'); // Anchor
    drawPoint(P3, '#fff'); // Anchor
    // Highlight if dragging
    drawPoint(P1.pos, draggingPoint === P1 ? '#ff0000' : '#ffcc00'); // Control 1
    drawPoint(P2.pos, draggingPoint === P2 ? '#ff0000' : '#ffcc00'); // Control 2
}

function drawPoint(p, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
}

// --- 7. Main Loop ---

let lastTime = 0;
let fpsTimer = 0;
let frameCount = 0;
const fpsElement = document.getElementById('fps-meter');

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updatePhysics();
    draw();
    
    // FPS Calculation (update every 500ms)
    fpsTimer += deltaTime;
    frameCount++;
    
    if (fpsTimer >= 500) {
        const fps = Math.round((frameCount * 1000) / fpsTimer);
        if (fpsElement) {
             fpsElement.innerText = `FPS: ${fps}`;
        }
        fpsTimer = 0;
        frameCount = 0;
    }

    requestAnimationFrame(loop);
}

// --- 8. Events ---

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mousePos = new Vector2(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
    // Check if clicking near P1 or P2
    const clickPos = new Vector2(e.clientX, e.clientY);
    const dist1 = clickPos.dist(P1.pos);
    const dist2 = clickPos.dist(P2.pos);
    
    // Threshold for clicking
    const threshold = 30; // 30px radius target
    
    if (dist1 < threshold) {
        draggingPoint = P1;
    } else if (dist2 < threshold) {
        draggingPoint = P2;
    }
});

window.addEventListener('mouseup', () => {
    draggingPoint = null;
});

// Init
resize();
requestAnimationFrame(loop);
