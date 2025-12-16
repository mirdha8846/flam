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

// --- 2. Audio Engine (The "Unique" Factor) ---

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
}

function playTwang(tension) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Frequency based on tension (higher tension = higher pitch)
    // Base 200Hz, plus tension scaler
    const freq = 200 + (tension * 2); 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.5); // Pitch drop effect

    // Volume envelope
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'triangle';
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}


// --- 3. Physics Engine ---

class SpringPoint {
    constructor(x, y, stiffness = 0.08, damping = 0.90) { // Heavy rope feel
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.stiffness = stiffness; 
        this.damping = damping;
        
        // Vibration properties
        this.vibrationAmp = 0;
        this.vibrationPhase = 0;
    }

    update(targetPos) {
        // Main Hooke's Law Physics
        const force = targetPos.sub(this.pos).mult(this.stiffness);
        this.vel.addClass(force);
        this.vel.multScalar(this.damping);
        this.pos.addClass(this.vel);
        
        // Vibration Decay
        this.vibrationAmp *= 0.95; 
        this.vibrationPhase += 0.5; // High speed oscillation phase
    }

    triggerVibration(intensity) {
        this.vibrationAmp = intensity;
    }
}

// --- 4. Particle System (Visual Juice) ---

class Particle {
    constructor(x, y, color) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        this.life = 1.0;
        this.color = color;
    }
    
    update() {
        this.pos.addClass(this.vel);
        this.vel.multScalar(0.9); // Air friction
        this.life -= 0.03;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

let particles = [];

function spawnParticles(x, y, count, color) {
    for(let i=0; i<count; i++) {
        particles.push(new Particle(x, y, color));
    }
}


// --- 5. App State & Logic ---

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let mousePos = new Vector2(0, 0);
let targetP1 = new Vector2(0, 0);
let targetP2 = new Vector2(0, 0);
let P0, P3; 
let P1, P2; 
let draggingPoint = null;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const midY = height / 2;
    const margin = width * 0.2;
    P0 = new Vector2(margin, midY);
    P3 = new Vector2(width - margin, midY);
    const span = width - 2 * margin;
    // Heavy Physics Default
    P1 = new SpringPoint(margin + span * 0.33, midY, 0.08, 0.90);
    P2 = new SpringPoint(margin + span * 0.66, midY, 0.08, 0.90);
    targetP1 = new Vector2(margin + span * 0.33, midY);
    targetP2 = new Vector2(margin + span * 0.66, midY);
}

// --- 6. Motion Logic ---

function updatePhysics() {
    
    const midY = height / 2;
    const margin = width * 0.2;
    const span = width - 2 * margin;
    const restP1 = new Vector2(margin + span * 0.33, midY);
    const restP2 = new Vector2(margin + span * 0.66, midY);
    
    const influenceRadius = 300; 
    const influenceStrength = 0.4; 
    
    // -- Handle P1 --
    if (draggingPoint === P1) {
        targetP1 = mousePos; 
    } else {
        let target = restP1;
        const dist = mousePos.dist(restP1);
        if (dist < influenceRadius) {
            const pull = mousePos.sub(restP1);
            const factor = Math.max(0, 1 - (dist / influenceRadius));
            target = target.add(pull.mult(factor * factor * influenceStrength));
        }
        targetP1 = target;
    }

    // -- Handle P2 --
    if (draggingPoint === P2) {
        targetP2 = mousePos;
    } else {
        let target = restP2;
        const dist = mousePos.dist(restP2);
        if (dist < influenceRadius) {
            const pull = mousePos.sub(restP2);
            const factor = Math.max(0, 1 - (dist / influenceRadius));
            target = target.add(pull.mult(factor * factor * influenceStrength));
        }
        targetP2 = target;
    }
    
    P1.update(targetP1);
    P2.update(targetP2);
    
    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

// --- 7. Bezier Math ---

function getBezierPoint(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    // Add Vibration Noise
    // We add a sine wave perpendicular to the line? or just Y offset for simplicity.
    // Let's use P1 and P2's vibration state to perturb the curve
    
    // Simple interpolation of vibration amplitude based on t
    // P1 affects 0.33 region, P2 affects 0.66 region
    // Simplification: Average vibration for the whole string (but strongest in middle)
    const vib1 = Math.sin(P1.vibrationPhase) * P1.vibrationAmp;
    const vib2 = Math.sin(P2.vibrationPhase) * P2.vibrationAmp;
    
    // Weigh vibration by bell curve (sin(PI*t)) so ends don't vibrate
    const vibrationY = (vib1 + vib2) * Math.sin(Math.PI * t); 

    const term0 = p0.mult(mt3);
    const term1 = p1.mult(3 * mt2 * t);
    const term2 = p2.mult(3 * mt * t2);
    const term3 = p3.mult(t3);

    const b = term0.add(term1).add(term2).add(term3);
    b.y += vibrationY; // Apply vibration
    return b;
}

function getBezierTangent(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const v1 = p1.sub(p0).mult(3 * mt2);
    const v2 = p2.sub(p1).mult(6 * mt * t);
    const v3 = p3.sub(p2).mult(3 * t2);
    return v1.add(v2).add(v3).normalize();
}

// --- 8. Rendering ---

function draw() {
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, width, height);

    // Filter Grid
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
    for(let y=0; y<height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
    ctx.stroke();

    // 1. Draw "String"
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffcc';
    
    // Dynamic color based on tension/velocity could be cool, but keep standard for now
    
    ctx.beginPath();
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
    ctx.lineTo(P3.x, P3.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Tangents
    ctx.strokeStyle = '#ff00de';
    ctx.lineWidth = 2;
    const tangentInterval = 0.1;
    for (let t = 0; t <= 1.0; t += tangentInterval) {
        let p = getBezierPoint(t, P0, P1.pos, P2.pos, P3);
        let tan = getBezierTangent(t, P0, P1.pos, P2.pos, P3);
        const tanLen = 20;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + tan.x * tanLen, p.y + tan.y * tanLen);
        ctx.stroke();
    }

    // 3. Control Structure
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

    // 4. Points
    drawPoint(P0, '#fff'); 
    drawPoint(P3, '#fff'); 
    drawPoint(P1.pos, draggingPoint === P1 ? '#ff0000' : '#ffcc00'); 
    drawPoint(P2.pos, draggingPoint === P2 ? '#ff0000' : '#ffcc00'); 
    
    // 5. Particles
    particles.forEach(p => p.draw(ctx));
}

function drawPoint(p, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
}

// --- 9. Loops & Events ---

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
    
    fpsTimer += deltaTime;
    frameCount++;
    if (fpsTimer >= 500) {
        const fps = Math.round((frameCount * 1000) / fpsTimer);
        if (fpsElement) fpsElement.innerText = `FPS: ${fps}`;
        fpsTimer = 0;
        frameCount = 0;
    }
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mousePos = new Vector2(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
    // Start Audio Context on first interaction
    initAudio();
    
    const clickPos = new Vector2(e.clientX, e.clientY);
    const dist1 = clickPos.dist(P1.pos);
    const dist2 = clickPos.dist(P2.pos);
    const threshold = 30;
    
    if (dist1 < threshold) draggingPoint = P1;
    else if (dist2 < threshold) draggingPoint = P2;
});

window.addEventListener('mouseup', () => {
    if (draggingPoint) {
        // Calculate tension based on distance from rest
        // We know rest positions from update logic, but let's approx with velocity or just displacement
        // A simple "snap" effect
        const tension = draggingPoint.vel.mag() * 10; // Or dist from rest
        // Actually, dragging point has low velocity, we want the SNAP. 
        // Let's use the distance from its rest position at the moment of release.
        
        // Approximate rest pos check
        const midY = height / 2;
        const margin = width * 0.2;
        const span = width - 2 * margin;
        
        // Just use arbitrary huge tension if it was far
        // Simplified: Play Sound!
        playTwang(100); 
        
        // Trigger Vibration Physics
        draggingPoint.triggerVibration(15); // Amplitude in pixels
        
        // Spawn Particles
        spawnParticles(draggingPoint.pos.x, draggingPoint.pos.y, 20, '#ffffff');
    }
    draggingPoint = null;
});

resize();
requestAnimationFrame(loop);
