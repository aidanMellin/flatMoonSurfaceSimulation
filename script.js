// Global variables
let gl;
let shaderProgram;
let positionBuffer;
let projectionMatrix;
let viewMatrix;
let uProjectionMatrixLocation;
let fov = 60; // Field of view in degrees
let cameraPosition = [0, .3, 1.6];
let lookAtPoint = [0, 1, -1];
let upVector = [0, 1, 0];
let rand = Math.random();

let cameraAngleX = 0;
let cameraAngleY = 0;
let cameraSpeed = 0.1;
let rotationSpeed = 0.005;

const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uProjectionMatrix;

    void main() {
        gl_PointSize = 2.0; // Set this to a visible size
        gl_Position = uProjectionMatrix * aVertexPosition;
    }`;

const fragmentShaderSource = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white color
    }`;

function init() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return;
    }

    projectionMatrix = mat4.create();
    viewMatrix = mat4.create();

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let vertices = createGrid(100, 100);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

    setupCamera();
    setupEventListeners();

    render();
}

function setupCamera() {
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.perspective(projectionMatrix, (fov * Math.PI) / 180, aspect, 0.1, 100.0);
    mat4.lookAt(viewMatrix, cameraPosition, lookAtPoint, upVector);
    mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix);
    updateCamera();
}

function setupEventListeners() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case 'w': // Move forward
                cameraPosition[0] += cameraSpeed * Math.sin(cameraAngleY);
                cameraPosition[2] -= cameraSpeed * Math.cos(cameraAngleY);
                break;
            case 's': // Move backward
                cameraPosition[0] -= cameraSpeed * Math.sin(cameraAngleY);
                cameraPosition[2] += cameraSpeed * Math.cos(cameraAngleY);
                break;
            case 'a': // Move left
                cameraPosition[0] -= cameraSpeed * Math.cos(cameraAngleY);
                cameraPosition[2] -= cameraSpeed * Math.sin(cameraAngleY);
                break;
            case 'd': // Move right
                cameraPosition[0] += cameraSpeed * Math.cos(cameraAngleY);
                cameraPosition[2] += cameraSpeed * Math.sin(cameraAngleY);
                break;
            case 'ArrowLeft': // Rotate left
                cameraAngleY -= rotationSpeed;
                break;
            case 'ArrowRight': // Rotate right
                cameraAngleY += rotationSpeed;
                break;
            case 'ArrowUp': // Increase FOV
                fov = Math.min(fov + 1, 120);
                break;
            case 'ArrowDown': // Decrease FOV
                fov = Math.max(fov - 1, 1);
                break;
        }
        updateCamera();
    });

    // Prevent the default right-click context menu
    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);

    window.addEventListener('mousedown', function(event) {
        if (event.button === 2) { // Right mouse button
            isDragging = true;
            gl.canvas.requestPointerLock(); // Lock the pointer to the canvas
            previousMousePosition.x = event.clientX;
            previousMousePosition.y = event.clientY;
        }
    });

    // Mouse move event
    window.addEventListener('mousemove', function(event) {
        if (isDragging) {
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            // Rotate the camera left/right
            cameraAngleY += movementX * rotationSpeed;

            // Rotate the camera up/down
            cameraAngleX -= movementY * rotationSpeed;

            // Limit vertical look to straight up or straight down
            cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));

            updateCamera();
        }
    });

    window.addEventListener('wheel', function(event) {
        const zoomSensitivity = 0.1;
        const zoomDirection = Math.sign(event.deltaY);

        // Zooming in/out
        let zoomAmount = zoomDirection * zoomSensitivity;
        cameraPosition = cameraPosition.map((val, idx) => {
            if (idx === 1) return val; // Don't change Y-axis
            return val * (1 - zoomAmount);
        });

        updateCamera();
    });

    // Mouse up event
    window.addEventListener('mouseup', function (event) {
        if (event.button === 2) { // Right mouse button
            isDragging = false;
            document.exitPointerLock(); // Release the pointer lock
        }
    });

    window.addEventListener('resize', function () {
        if (resizeCanvasToDisplaySize(gl.canvas)) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            setupCamera();
        }
    });
}

function updateCamera() {
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.perspective(projectionMatrix, (fov * Math.PI) / 180, aspect, 0.1, 100.0);

    let lookDirection = [
        Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
        Math.sin(cameraAngleX),
        -Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
    ];

    let lookAtPoint = [
        cameraPosition[0] + lookDirection[0],
        cameraPosition[1] + lookDirection[1],
        cameraPosition[2] + lookDirection[2]
    ];

    mat4.lookAt(viewMatrix, cameraPosition, lookAtPoint, upVector);
    mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix);
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createGrid(rows, columns) {
    let vertices = [];

    for (let z = 0; z < rows; z++) {
        for (let x = 0; x < columns; x++) {
            let nx = x / columns - 0.5, // Normalize X
                nz = z / rows - 0.5;    // Normalize Z
            let height = layeredNoise(nx, nz);

            // Current point
            vertices.push(2 * nx, height, 2 * nz);

            // Connect to the right neighbor
            if (x < columns - 1) {
                let nextHeightX = layeredNoise((x + 1) / columns - 0.5, nz);
                vertices.push(2 * ((x + 1) / columns) - 0.5, nextHeightX, 2 * nz); // Point to the right
                vertices.push(2 * nx, height, 2 * nz); // Back to current point
            }

            // Connect to the upper neighbor
            if (z < rows - 1) {
                let nextHeightZ = layeredNoise(nx, (z + 1) / rows - 0.5);
                vertices.push(2 * nx, nextHeightZ, 2 * ((z + 1) / rows) - 0.5); // Point above
                if (x < columns - 1) {
                    vertices.push(2 * nx, height, 2 * nz); // Back to current point
                }
            }
        }
    }
    return vertices;
}




function layeredNoise(nx, nz) {
    // Sum multiple layers of noise
    let amplitude = 1;
    let frequency = 1;
    let noiseSum = 0;
    let maxAmplitude = 0; // Used for normalizing result

    // Parameters for each layer
    let layers = 4;
    let persistence = 0.5;

    for (let i = 0; i < layers; i++) {
        noiseSum += amplitude * perlin(nx * frequency, nz * frequency, 0, rand);
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= 2;
    }

    return noiseSum / maxAmplitude;
}


function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(uProjectionMatrixLocation, false, projectionMatrix);

    gl.drawArrays(gl.LINES, 0, (100 + 1) * (100 + 1));

    requestAnimationFrame(render);
}


function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

// Call the init function when the window loads
window.onload = init;
