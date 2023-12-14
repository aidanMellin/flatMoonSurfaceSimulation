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
    uniform mat4 uProjectionMatrix;

    void main() {
        gl_PointSize = 2.0; // Set this to a visible size
        gl_Position = uProjectionMatrix * aVertexPosition;
    }`;

const fragmentShaderSource = `
    uniform bool uIsStar;

    void main() {
        if (uIsStar) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Bright white for stars
        } else {
            gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0); // Slightly off-white/gray for terrain
        }
    }`;



function init() {
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

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return;
    }

    texture = gl.createTexture();
      
        const image = new Image();


        image.src = 'moontext.png'; // note: file in same dir as other files for program
        image.decode();
        // img is ready to use: this console write is left here to help
        // others with potential debugging when changing this function
        console.log(`width: ${image.width}, height: ${image.height}`);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        // create and bind your current object
        starPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, starPositionBuffer);
        let starVertices = createStarField(1000); // Adjust the number of stars as needed
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(starVertices), gl.STATIC_DRAW);
    
    
        projectionMatrix = mat4.create();
        viewMatrix = mat4.create();
    
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        vertices = createGrid(100, 100);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
        uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    
        renderType = gl.TRIANGLES;
    
        createNewShape();
        setupCamera();
        setupEventListeners();
        // do a draw
        render();
       
     
    //render();
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
            case '+':
                rows = Math.min(rows + 10, 200); // Prevent it from going too high
                columns = Math.min(columns + 10, 200);
                regenerateGrid();
                break;
            case '-':
                rows = Math.max(rows - 10, 10); // Prevent it from going too low
                columns = Math.max(columns - 10, 10);
                regenerateGrid();
                break;
            case "[":
                renderType = gl.TRIANGLES;
                render();
                break;
            case "]":
                renderType = gl.LINES;
                render();
                break;
        }
        updateCamera();
    });

    // Prevent the default right-click context menu
    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);

    window.addEventListener('mousedown', function (event) {
        if (event.button === 2) { // Right mouse button
            isDragging = true;
            gl.canvas.requestPointerLock(); // Lock the pointer to the canvas
            previousMousePosition.x = event.clientX;
            previousMousePosition.y = event.clientY;
        }
    });

    // Mouse move event
    window.addEventListener('mousemove', function (event) {
        if (isDragging) {
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            // Rotate the camera left/right
            cameraAngleY += movementX * rotationSpeed;

            // Rotate the camera up/down
            cameraAngleX -= movementY * rotationSpeed;

            // Limit vertical look to straight up or straight down
            cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraAngleX));

            updateCamera();
        }
    });

    window.addEventListener('wheel', function (event) {
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

function regenerateGrid() {
    let vertices = createGrid(rows, columns);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
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

    // Create vertices and store them in a grid
    for (let z = 0; z <= rows; z++) {
        let row = [];
        for (let x = 0; x <= columns; x++) {
            let nx = x / columns - 0.5, // Normalize X
                nz = z / rows - 0.5;    // Normalize Z
            let height = layeredNoise(nx, nz);

            let vertex = [2 * nx, height, 2 * nz];
            row.push(vertex);
        }
        grid.push(row);
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
        }
    }

    return vertices;
}

// general call to make and bind a new object based on current
  // settings..Basically a call to shape specfic calls in cgIshape.js
  function createNewShape() {
      
    // clear your points and elements
    points = [];
    indices = [];
    uvs = [];

    // make your shape based on type
    createGrid(100,100);
    
    //create and bind VAO
    if (myVAO == null) myVAO = gl.createVertexArray();
    gl.bindVertexArray(myVAO);
    
    // create and bind vertex buffer
    if (myVertexBuffer == null) myVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
    gl.vertexAttribPointer(shaderProgram.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
    
    // create and bind uv buffer
    if (myUVBuffer == null) myUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.aVertexTextureCoords);
    // note that texture uv's are 2d, which is why there's a 2 below
    gl.vertexAttribPointer(shaderProgram.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

    // uniform values
    gl.uniform3fv (shaderProgram.uTheta, new Float32Array(angles));
   
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

    let totalLines = (rows - 1) * columns + rows * (columns - 1);
    let totalVertices = totalLines * 2;


    gl.drawArrays(renderType, 0, totalVertices);

    gl.bindBuffer(gl.ARRAY_BUFFER, starPositionBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, 1000); // Number of stars

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
