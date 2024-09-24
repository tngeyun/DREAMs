let particles = [];
let numAnchors = 20; // Number of anchor points vertically
let anchors = []; // Array to store anchor points
let isUsingFlowField = false; // State whether particles move according to Perlin noise
let cols, rows;
let scale = 20;
let zOffset = 0;
let flowField = [];
let currentShape = 0; // 0 = circle, 1 = star, 2 = cat head, 3 = camera
let isMovingToShape = false; // State whether particles are moving to the shape
let shapeColor; // Variable to store random color for each shape

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  createAnchors(); // Create anchor points outside the canvas
  updateFlowField(); // Initialize flow field

  // Create many particles starting from random positions
  for (let i = 0; i < 2500; i++) {
    particles[i] = new Particle();
  }

  // Set all particles to anchor points outside the canvas
  for (let i = 0; i < particles.length; i++) {
    particles[i].target = random(anchors); // Choose random anchor point
  }

  background(0); // Set background to black
}

function draw() {

  if (!isUsingFlowField) {
    background(0, 5); // Set background to black with low opacity
  }

  if (isUsingFlowField) {
    document.dispatchEvent(new Event('flowField'));
    background(0, 1); // Create fading effect
    let yOffset = 0;

    // Create flow field based on Perlin Noise
    for (let y = 0; y < rows; y++) {
      let xOffset = 0;
      for (let x = 0; x < cols; x++) {
        let index = x + y * cols;
        let angle = noise(xOffset, yOffset, zOffset) * TWO_PI * 4;
        let v = p5.Vector.fromAngle(angle);
        v.setMag(1);
        flowField[index] = v;
        xOffset += 0.1;
      }
      yOffset += 0.1;
    }
    zOffset += 0.005;

    // Update and display particles according to flow field
    for (let i = 0; i < particles.length; i++) {
      particles[i].follow(flowField);
      particles[i].update();
      particles[i].edges();
      particles[i].show();
    }
  } else if (isMovingToShape) {
    // Move particles according to anchor points forming shapes
    for (let i = 0; i < particles.length; i++) {
      particles[i].moveTowardsShape();
      particles[i].update();
      particles[i].edges();
      particles[i].show();
    }
  } else {
    // Move particles according to anchor points outside the canvas
    for (let i = 0; i < particles.length; i++) {
      particles[i].moveTowardsAnchor();
      particles[i].update();
      particles[i].edges();
      particles[i].show();
      document.dispatchEvent(new Event('anchors'));
    }
  }
}

// Create anchor points for different shapes
function createAnchors() {
  anchors = []; // Reset anchors array
  let spacing = height * 0.1 / (numAnchors - 1); // Distance between anchor points
  let start = height * 0.45; // Start point 45% from the top edge

  // Create anchor points outside the canvas (x = width + 20px)
  for (let i = 0; i < numAnchors; i++) {
    let y = start + i * spacing;
    anchors.push(createVector(width + 20, y)); // Anchor point outside the canvas
  }
}

function updateFlowField() {
  cols = floor(width / scale);
  rows = floor(height / scale);
  flowField = new Array(cols * rows);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateFlowField();
}

// Control state with keys
function keyPressed() {
  if (key === 'f') {
    isUsingFlowField = !isUsingFlowField; // Toggle between flow field and anchor points
    if (isUsingFlowField) {
      isMovingToShape = false; // Set state to not moving to shape
      
    } else {
      createAnchors(); // Recreate anchor points outside the canvas
      for (let i = 0; i < particles.length; i++) {
        particles[i].target = random(anchors); // Choose random anchor point
      }
    }
  }

  if (key === ' ') {
    // Toggle shape and allow moving to anchor points
    if (isUsingFlowField) {
      isMovingToShape = true; // Move to anchor points forming shapes
      createShapeAnchors(); // Create anchor points for shapes
    } else {
      isMovingToShape = true; // Allow particles to move to shape anchor points when not in flow field state
      createShapeAnchors(); // Recreate shape
    }
  }
}

// Create anchor points forming shapes
function createShapeAnchors() {
  anchors = []; // Clear old anchor points
  let centerX = width / 2;
  let centerY = height / 2;
  let radiusX = min(width, height) * 0.3;
  let radiusY = min(width, height) * 0.3;
  // Assign random color when switching shapes
  shapeColor = color(random(360), 100, 100, 100); // Random color in HSB mode

  if (currentShape === 0) {
    // Create circle
    let numPoints = 12;
    for (let i = 0; i < numPoints; i++) {
      let angle = TWO_PI / numPoints * i;
      let x = centerX + cos(angle) * radiusX;
      let y = centerY + sin(angle) * radiusY;
      anchors.push(createVector(x, y));
    }
  } else if (currentShape === 1) {
    // Create star
    let numPoints = 5;
    for (let i = 0; i < numPoints; i++) {
      let angle = TWO_PI / numPoints * i;
      let x = centerX + cos(angle) * radiusX;
      let y = centerY + sin(angle) * radiusY;
      anchors.push(createVector(x, y));
    }
  } else if (currentShape === 2) {
    // Create flatter cat head
    let headRadiusX = radiusX * 0.9; // Radius along X-axis (flatter)
    let headRadiusY = radiusY * 0.7; // Radius along Y-axis (smaller)
    let headCenterX = centerX;
    let headCenterY = centerY - radiusY * 0.1; // Adjust head position

    let numHeadPoints = 24;
    for (let i = 0; i < numHeadPoints; i++) {
      let angle = TWO_PI / numHeadPoints * i;
      let x = headCenterX + cos(angle) * headRadiusX;
      let y = headCenterY + sin(angle) * headRadiusY;
      anchors.push(createVector(x, y));
    }

    // Create cat ears
    let leftEar = createVector(centerX - headRadiusX * 1.5, headCenterY - headRadiusY * 1.3); // Left ear
    let rightEar = createVector(centerX + headRadiusX * 1.5, headCenterY - headRadiusY * 1.3); // Right ear
    anchors.push(leftEar);
    anchors.push(rightEar);
    
  } else if (currentShape === 3) {
    // Create camera shape with body and lens
    let rectWidth = radiusX * 2.5; // Use radiusX
    let rectHeight = radiusY * 1.5; // Use radiusY

    // Group anchor points for rectangle (body)
    let rectAnchors = [];
    let topLeft = createVector(centerX - rectWidth / 2, centerY - rectHeight / 2);
    let topRight = createVector(centerX + rectWidth / 2, centerY - rectHeight / 2);
    let bottomRight = createVector(centerX + rectWidth / 2, centerY + rectHeight / 2);
    let bottomLeft = createVector(centerX - rectWidth / 2, centerY + rectHeight / 2);

    rectAnchors.push(topLeft, topRight, bottomRight, bottomLeft);
    anchors = anchors.concat(rectAnchors);

    // Group anchor points for circle (lens)
    let lensRadiusX = radiusX * 0.6; // Lens radius
    let lensRadiusY = radiusY * 0.6; // Lens radius
    let lensCenterX = centerX + rectWidth * 0.2;  // Offset to the right of the rectangle
    let lensCenterY = centerY;

    let numLensPoints = 12;
    for (let i = 0; i < numLensPoints; i++) {
      let angle = TWO_PI / numLensPoints * i;
      let x = lensCenterX + cos(angle) * lensRadiusX;
      let y = lensCenterY + sin(angle) * lensRadiusY;
      anchors.push(createVector(x, y));
    }
    } else if (currentShape === 4) {
    // Create open book shape
    let bookWidth = radiusX * 2;
    let bookHeight = radiusY * 1.5;
    let spineThickness = 30; // Thickness of the book spine
    let numPages = 3;
    let pageSpacing = bookHeight / numPages;

    // Draw left cover
    anchors.push(createVector(centerX - bookWidth / 2, centerY - bookHeight / 2));
    anchors.push(createVector(centerX - bookWidth / 2, centerY + bookHeight / 2));

    // Draw right cover
    anchors.push(createVector(centerX + bookWidth / 2, centerY - bookHeight / 2));
    anchors.push(createVector(centerX + bookWidth / 2, centerY + bookHeight / 2));

    // Draw thicker book spine
    anchors.push(createVector(centerX - spineThickness / 2, centerY - bookHeight / 2));
    anchors.push(createVector(centerX - spineThickness / 2, centerY + bookHeight / 2));
    anchors.push(createVector(centerX + spineThickness / 2, centerY - bookHeight / 2));
    anchors.push(createVector(centerX + spineThickness / 2, centerY + bookHeight / 2));
  }

  currentShape = (currentShape + 1) % 5; // Increment current shape and loop back
for (let i = 0; i < particles.length; i++) {
    particles[i].target = random(anchors);   // Assign random anchor point
    particles[i].targetColor = shapeColor;   // Assign random target color
}
}
// Particle class
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = random(1, 3); // Random maximum speed for each particle
    this.target = createVector(random(width), random(height));
    this.prevPos = this.pos.copy();
    this.hue = random(360); // Random color
    this.targetColor = this.color; // Target color

    // Initialize currentColor as p5.Color object
    this.currentColor = color(255, 255, 255); // Initial white color
  }
  applyForce(force) {
    this.acc.add(force);
  }


  follow(vectors) {
    let x = floor(this.pos.x / scale);
    let y = floor(this.pos.y / scale);
    let index = x + y * cols;
    let force = vectors[index];
    this.applyForce(force);
  }

  moveTowardsAnchor() {
    let force = p5.Vector.sub(this.target, this.pos);
    force.setMag(5);
    this.applyForce(force);

    // Update target if close to anchor point
    if (p5.Vector.dist(this.pos, this.target) < 10) {
      this.target = random(anchors);
    }
  }

  moveTowardsShape() {
    let force = p5.Vector.sub(this.target, this.pos);
    force.setMag(1);
    this.applyForce(force);

    // If close to target, choose new random anchor point
    if (p5.Vector.dist(this.pos, this.target) < 5) {
      this.target = random(anchors);
    }
  }
   update() {
  this.vel.add(this.acc);
  this.vel.limit(this.maxSpeed);
  this.pos.add(this.vel);
  this.acc.mult(0);
}

show() {
  // Check movement mode
  if (isMovingToShape) {
    // Moving to shape mode -> Random neon color
    colorMode(HSB, 360, 100, 100, 100);
    this.hue = random(); // Hue changes randomly within a small range
    if (this.hue > 360) this.hue = 0;
    this.targetColor = shapeColor; // Neon color as target

  } else if (isUsingFlowField) {
    // Flow field mode -> Neon color with motion effect
    colorMode(HSB, 360, 100, 100, 100);
    this.hue += 1; // Hue changes continuously to create neon effect
    if (this.hue > 360) this.hue = 0;
    this.targetColor = color(this.hue, 100, 100, 80); // Neon color as target

  } else {
    // Moving to anchor points outside the canvas -> White color
    colorMode(RGB);
    this.targetColor = color(255, 255, 255, 200); // White color as target
  }

  // Smooth transition from current color to target color
  this.currentColor = lerpColor(this.currentColor, this.targetColor, 0.05);

  // Apply current color
  stroke(this.currentColor);
  strokeWeight(1.5);

  // Draw line connecting current position to previous position
  line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);

  // Update previous position
  this.updatePrev();
}

updatePrev() {
  this.prevPos.x = this.pos.x;
  this.prevPos.y = this.pos.y;
}

edges() {
  // When particle goes off the canvas, place it on the opposite side and choose new anchor point
  if (this.pos.x > width + 20) {
    this.pos.x = -20;
    this.target = random(anchors);
    this.updatePrev();
  }
  if (this.pos.x < -20) {
    this.pos.x = width + 20;
    this.target = random(anchors);
    this.updatePrev();
  }
  if (this.pos.y > height) {
    this.pos.y = 0;
    this.updatePrev();
  }
  if (this.pos.y < 0) {
    this.pos.y = height;
    this.updatePrev();
  }
}
}