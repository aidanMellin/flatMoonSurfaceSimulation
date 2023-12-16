
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
                // regenerateGrid();
                break;
            case '-':
                rows = Math.max(rows - 10, 10); // Prevent it from going too low
                columns = Math.max(columns - 10, 10);
                // regenerateGrid();
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