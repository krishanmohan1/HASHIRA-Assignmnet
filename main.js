const fs = require('fs');

// Convert any base string to BigInt
function convertToDecimal(value, base) {
    return BigInt([...value].reduce((acc, digit) => {
        return acc * BigInt(base) + BigInt(parseInt(digit, base));
    }, BigInt(0)));
}

// Lagrange interpolation at x = 0
function lagrangeInterpolationAtZero(points) {
    let result = BigInt(0);
    for (let i = 0; i < points.length; i++) {
        let [xi, yi] = points[i];
        xi = BigInt(xi);
        yi = BigInt(yi);
        let num = BigInt(1), den = BigInt(1);

        for (let j = 0; j < points.length; j++) {
            if (i !== j) {
                let xj = BigInt(points[j][0]);
                num *= -xj;
                den *= (xi - xj);
            }
        }

        const term = yi * num / den;
        result += term;
    }
    return result;
}

// Parse the input JSON file
function parseInput(file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const n = data.keys.n;
    const k = data.keys.k;

    let points = [];
    for (const key in data) {
        if (key === 'keys') continue;
        const x = parseInt(key);
        const base = parseInt(data[key].base);
        const yStr = data[key].value;
        const y = convertToDecimal(yStr, base);
        points.push([x, y]);
    }

    // Sort by x for consistency
    points.sort((a, b) => a[0] - b[0]);

    return points.slice(0, k); // Take only the first k points
}

// Run for both test cases
const files = ['input1.json', 'input2.json'];

files.forEach((file, index) => {
    const points = parseInput(file);
    const secret = lagrangeInterpolationAtZero(points);
    console.log(`✅ Secret for Test Case ${index + 1}: ${secret.toString()}`);
});
