function fade(t) {
    // Fade function as defined by Ken Perlin
    // This eases coordinate values so that they will ease towards integral values.
    // This helps to avoid artifacts in the final output.
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    // Linear interpolation between a and b by t
    return a + t * (b - a);
}

function grad(hash, x, y, z) {
    // Calculate gradient vector based on hash value
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x, y, z, rand) {
    // Determine grid cell coordinates
    const X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255,
        Z = Math.floor(z) & 255;

    // Find relative x, y, z of point in grid cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves for x, y, z
    const u = fade(x),
        v = fade(y),
        w = fade(z);

    // Hash coordinates of the 8 cube corners

    let permutation = [];
    for (let i = 0; i < 256; i++) {
        permutation[i] = i;
    }

    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rand * (i + 1));
        const temp = permutation[i];
        permutation[i] = permutation[j];
        permutation[j] = temp;
    }

    const p = new Array(512);
    for (let i = 0; i < 512; i++) {
        p[i] = permutation[i % 256];
    }

    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
        B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

    // Add blended results from 8 corners of cube
    return lerp(
        lerp(
            lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
            lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
            v),
        lerp(
            lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
            lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
            v),
        w);
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