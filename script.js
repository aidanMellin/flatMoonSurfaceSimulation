// Global variables
let gl;
let myIndexBuffer;
let myVAO;
let grid = [];
let myVertexBuffer;
let myUVBuffer;
let shaderProgram;
let positionBuffer;
let projectionMatrix;
let viewMatrix;
let vertices = [];
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

// Other globals with default values;
var division1 = 3;
var division2 = 1;
var updateDisplay = true;
var anglesReset = [30.0, 30.0, 0.0];
var angles = [30.0, 30.0, 0.0];
var angleInc = 5.0;

let rows = 100;
let columns = 100;

let renderType;

let starPositionBuffer;

const vertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec2 aVertexTextureCoords; // New attribute for UVs
varying vec2 vTextureCoords; // To pass UVs to the fragment shader

uniform mat4 uProjectionMatrix;

void main() {
    gl_PointSize = 2.0;
    gl_Position = uProjectionMatrix * aVertexPosition;
    vTextureCoords = aVertexTextureCoords; // Pass UVs to the fragment shader
}
`;

const fragmentShaderSource = `
precision mediump float; // Add this for WebGL1 compatibility

varying vec2 vTextureCoords; // Receive UVs
uniform sampler2D uTexture; // Texture sampler
uniform bool uUseTexture; // Flag to enable/disable texture

void main() {
    if (uUseTexture) {
        gl_FragColor = texture2D(uTexture, vTextureCoords); // Apply texture
    } else {
        gl_FragColor = vec4(1.0); // White color for stars
    }
}
`;

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

function loadTexture(gl, url) {
    return new Promise((resolve, reject) => {
        const texture = gl.createTexture();
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);
            resolve(texture);
            console.log("Texture loaded");
        };
        image.onerror = () => {
            reject(new Error(`Failed to load image at ${url}`));
        };
        image.src = url;
    });
}



function createGrid(rows, columns) {
    let vertices = []; // Array to store the vertices for WebGL
    let uvs = []; // Array for UVs
    grid = []; // Clear the grid array

    // Create vertices and store them in a grid
    for (let z = 0; z <= rows; z++) {
        let row = [];
        for (let x = 0; x <= columns; x++) {
            let nx = x / columns - 0.5; // Normalize X
            let nz = z / rows - 0.5; // Normalize Z
            let height = layeredNoise(nx, nz); // Get the height from the noise function

            let vertex = [2 *  nx, height, 2 * nz]; // Create the vertex
            row.push(vertex); // Add it to the row
        }
        grid.push(row); // Add the row to the grid
    }

    // Connect vertices to form triangles
    for (let z = 0; z < rows; z++) {
        for (let x = 0; x < columns; x++) {
            let bottomLeft = grid[z][x];
            let bottomRight = grid[z][x + 1];
            let topLeft = grid[z + 1][x];
            let topRight = grid[z + 1][x + 1];

            // Triangle 1
            vertices.push(...bottomLeft, ...bottomRight, ...topRight);

            // Triangle 2
            vertices.push(...bottomLeft, ...topRight, ...topLeft);

            let u1 = x / columns, v1 = z / rows;
            let u2 = (x + 1) / columns, v2 = (z + 1) / rows;

            // Triangle 1 UVs
            uvs.push(u1, v1, u2, v1, u2, v2);

            // Triangle 2 UVs
            uvs.push(u1, v1, u2, v2, u1, v2);
        }
    }

    // Return the vertices and uvs
    return { vertices, uvs };
}

function regenerateGrid() {
    let vertices = createGrid(rows, columns);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

// general call to make and bind a new object based on current
// settings..Basically a call to shape specfic calls in cgIshape.js
function createNewShape() {

    // clear your points and elements
    points = [];
    indices = [];

    // make your shape based on type
    let shapeData = createGrid(rows, columns);
    points = shapeData.vertices;
    uvs = shapeData.uvs;

    //create and bind VAO
    if (myVAO == null) myVAO = gl.createVertexArray();
    gl.bindVertexArray(myVAO);

    // create and bind vertex buffer
    if (myVertexBuffer == null) myVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
    gl.vertexAttribPointer(shaderProgram.aVertexPosition, 4, gl.FLOAT, false, 0, 0);

    // Set up UV buffer
    // create and bind UV buffer
    if (myUVBuffer == null) myUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.aVertexTextureCoords);
    gl.vertexAttribPointer(shaderProgram.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

    // uniform values
    gl.uniform3fv(shaderProgram.uTheta, new Float32Array(angles));

    // Setting up the IBO
    if (myIndexBuffer == null) myIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // indicate a redraw is required.
    updateDisplay = true;
}


function createStarField(numStars) {
    let stars = [];
    for (let i = 0; i < numStars; i++) {
        // Random positions far away
        let x = (Math.random() - 0.5) * 100;
        let y = (Math.random() - 0.5) * 100;
        let z = (Math.random() - 0.5) * 100;
        stars.push(x, y, z);
    }
    return stars;
}

async function init() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl2');

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
    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    shaderProgram.aVertexTextureCoords = gl.getAttribLocation(shaderProgram, 'aVertexTextureCoords');
    shaderProgram.uUseTexture = gl.getUniformLocation(shaderProgram, "uUseTexture");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return;
    }

    texture = gl.createTexture();

    try {
        texture = await loadTexture(gl, 'blueSquareStriped.jpeg');
    } catch (error) {
        alert('Texture loading failed: ' + error.message);
        return;
    }

    // create and bind your current object
    starPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starPositionBuffer);
    let starVertices = createStarField(1000); // Adjust the number of stars as needed
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(starVertices), gl.STATIC_DRAW);


    projectionMatrix = mat4.create();
    viewMatrix = mat4.create();

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let { vertices, uvs } = createGrid(rows, columns);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

    renderType = gl.TRIANGLES;

    gl.enable(gl.DEPTH_TEST);

    createNewShape();
    setupCamera();
    setupEventListeners();
    // do a draw
    render();
}

function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.vertexAttribPointer(shaderProgram.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(shaderProgram.uUseTexture, true); // Enable texture for moon
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uTexture"), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(uProjectionMatrixLocation, false, projectionMatrix);

    let totalLines = (rows - 1) * columns + rows * (columns - 1);
    let totalVertices = totalLines * 2;


    gl.drawArrays(renderType, 0, totalVertices);
    gl.uniform1i(shaderProgram.uUseTexture, false); // Disable texture for stars
    gl.bindBuffer(gl.ARRAY_BUFFER, starPositionBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, 1000); // Number of stars

    requestAnimationFrame(render);
}

// Call the init function when the window loads
window.onload = init;

