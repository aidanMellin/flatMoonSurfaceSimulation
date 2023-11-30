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
}

function setupEventListeners() {
    window.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'w':
                cameraPosition[2] -= 0.1; // Move forward
                break;
            case 's':
                cameraPosition[2] += 0.1; // Move backward
                break;
            case 'a':
                cameraPosition[0] -= 0.1; // Move left
                break;
            case 'd':
                cameraPosition[0] += 0.1; // Move right
                break;
            case 'ArrowUp':
                fov = Math.min(fov + 1, 120); // Increase FOV
                break;
            case 'ArrowDown':
                fov = Math.max(fov - 1, 1); // Decrease FOV
                break;
            // Add more cases as needed
        }
        updateCamera();
    });

    window.addEventListener('resize', function() {
        if (resizeCanvasToDisplaySize(gl.canvas)) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            setupCamera();
        }
    });
}

function updateCamera() {
    setupCamera();
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
    for (let z = 0; z <= rows; z++) {
        for (let x = 0; x <= columns; x++) {
            let nx = x / columns - 0.5, // Normalize X
                nz = z / rows - 0.5,    // Normalize Z
                height = layeredNoise(nx, nz);

            vertices.push(
                2 * nx,           // X (normalized and stretched)
                height,           // Y (height based on layered noise)
                2 * nz            // Z (normalized and stretched)
            );
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

    gl.drawArrays(gl.POINTS, 0, (100 + 1) * (100 + 1));

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
