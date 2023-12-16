function rectangleTest(){
// Define the vertices for the rectangle (two triangles)
const rectangleVertices = [
    -0.5, 0.5, 0.0, // Top-left
    0.5, 0.5, 0.0, // Top-right
    -0.5, -0.5, 0.0, // Bottom-left
    0.5, -0.5, 0.0, // Bottom-right
];

// Define the UV coordinates for the rectangle
const rectangleUVs = [
    0.0, 1.0, // Top-left
    1.0, 1.0, // Top-right
    0.0, 0.0, // Bottom-left
    1.0, 0.0, // Bottom-right
];

// Create and bind the buffer for rectangle vertices
const rectangleVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rectangleVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangleVertices), gl.STATIC_DRAW);

// Create and bind the buffer for rectangle UVs
const rectangleUVBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, rectangleUVBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangleUVs), gl.STATIC_DRAW);

// Bind the rectangle vertex buffer
gl.bindBuffer(gl.ARRAY_BUFFER, rectangleVertexBuffer);
gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shaderProgram.vertexPosition);

// Bind the rectangle UV buffer
gl.bindBuffer(gl.ARRAY_BUFFER, rectangleUVBuffer);
gl.vertexAttribPointer(shaderProgram.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shaderProgram.aVertexTextureCoords);

// Draw the rectangle
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}