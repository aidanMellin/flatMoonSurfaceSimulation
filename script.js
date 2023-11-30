const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    void main() {
        gl_PointSize = 2.0; // Increase the point size for visibility
        gl_Position = aVertexPosition;
    }`;


const fragmentShaderSource = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white color
    }`;

function init() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Load and compile the shaders
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return;
    }

    // Create the buffer for vertex positions
    const vertices = createGrid(100, 100); // Create a 100x100 grid
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Start the render loop
    render(gl, shaderProgram, positionBuffer);
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
    for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
            // Normalize x, y to [-1, 1]
            vertices.push(2 * x / columns - 1, 2 * y / rows - 1, 0);
        }
    }
    return vertices;
}


function render(gl, shaderProgram, positionBuffer) {
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);

    // Draw the grid (as points for now)
    gl.drawArrays(gl.POINTS, 0, (100 + 1) * (100 + 1)); // Adjust count based on grid size

    requestAnimationFrame(() => render(gl, shaderProgram, positionBuffer));
}

// Call the init function when the window loads
window.onload = init;
