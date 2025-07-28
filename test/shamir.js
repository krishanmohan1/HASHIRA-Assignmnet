// shamir.js

/**
 * Shamir's Secret Sharing Reconstruction Implementation
 *
 * This script focuses on reconstructing the constant term 'c' (equivalent to f(0))
 * of a polynomial given a set of shares (roots). It handles large numbers using BigInt
 * and decodes Y values from various bases as specified in the input JSON.
 */

// --- Helper Functions for Modular Arithmetic ---

/**
 * Ensures a positive result for the modulo operation.
 * @param {bigint} n - The number.
 * @param {bigint} m - The modulus.
 * @returns {bigint} The result of n % m, always positive.
 */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/**
 * Calculates the modular multiplicative inverse of 'a' modulo 'm' using the Extended Euclidean Algorithm.
 * This is crucial for division in modular arithmetic.
 * @param {bigint} a - The number.
 * @param {bigint} m - The modulus (must be a prime number).
 * @returns {bigint} The modular inverse of 'a' modulo 'm'.
 * @throws {Error} If 'a' has no modular inverse modulo 'm' (i.e., gcd(a, m) != 1).
 */
function modInverse(a, m) {
    // Ensure a is within the range [0, m-1)
    a = mod(a, m);
    // This is a simple brute-force for demonstration. For very large primes,
    // Extended Euclidean Algorithm is more efficient.
    for (let x = 1n; x < m; x++) {
        if (mod(a * x, m) === 1n) {
            return x;
        }
    }
    throw new Error(`No modular inverse for ${a} modulo ${m}. Modulus must be prime.`);
}

// --- Share Decoding Function ---

/**
 * Decodes a Y value string from a given base to a BigInt.
 * @param {string} valueString - The string representation of the Y value.
 * @param {number} base - The base of the valueString (e.g., 2, 10, 16).
 * @returns {bigint} The decoded Y value as a BigInt.
 * @throws {Error} If the valueString is not valid for the given base.
 */
function decodeYValue(valueString, base) {
    // BigInt constructor can parse strings with a specified radix (base)
    // It handles bases from 2 to 36.
    try {
        return BigInt(valueString, base);
    } catch (e) {
        throw new Error(`Failed to decode value '${valueString}' in base ${base}: ${e.message}`);
    }
}

// --- Shamir's Secret Sharing Core Reconstruction Function ---

/**
 * Reconstructs the secret (constant term 'c' or f(0)) from a given set of shares
 * using Lagrange Interpolation.
 * @param {Array<{x: bigint, y: bigint}>} shares - An array of shares (objects with x and y BigInt properties).
 * Must contain at least 'k' shares, where 'k' is the degree of polynomial + 1.
 * @param {bigint} prime - The large prime number used for the finite field.
 * @returns {bigint} The reconstructed secret (constant term 'c').
 * @throws {Error} If fewer than k shares are provided or if calculations fail.
 */
function reconstructSecret(shares, prime) {
    if (shares.length === 0) {
        throw new Error("No shares provided for reconstruction.");
    }

    let secret = 0n;
    const k = BigInt(shares.length); // k is now the number of shares provided

    // Lagrange Interpolation formula for P(0):
    // P(0) = Sum_{j=0}^{k-1} (y_j * Product_{m=0, m!=j}^{k-1} (x_m / (x_m - x_j))) mod prime
    for (let j = 0; j < shares.length; j++) {
        const currentShare = shares[j];
        const xj = currentShare.x;
        const yj = currentShare.y;

        let numerator = 1n;
        let denominator = 1n;

        for (let m = 0; m < shares.length; m++) {
            if (j === m) continue; // Skip if j == m

            const otherShare = shares[m];
            const xm = otherShare.x;

            // Numerator: Product of x_m (where m != j)
            numerator = mod(numerator * xm, prime);

            // Denominator: Product of (x_m - x_j) (where m != j)
            let diff = mod(xm - xj, prime);
            if (diff === 0n) {
                // This indicates an issue with the shares (e.g., duplicate x values),
                // which would make the denominator zero and division impossible.
                throw new Error(`Invalid shares: Duplicate x-coordinate ${xj.toString()} found or x_m - x_j resulted in zero.`);
            }
            denominator = mod(denominator * diff, prime);
        }

        // Calculate the Lagrange basis polynomial L_j(0) = (Numerator * modInverse(denominator)) mod prime
        let term = mod(yj * modInverse(denominator, prime), prime);
        term = mod(term * numerator, prime);

        secret = mod(secret + term, prime);
    }

    return secret;
}

// --- Main Application Logic (for HTML integration) ---

document.addEventListener('DOMContentLoaded', () => {
    const jsonInput1 = document.getElementById('jsonInput1'); // First test case input
    const jsonInput2 = document.getElementById('jsonInput2'); // Second test case input
    const runButton = document.getElementById('runButton');
    const outputConsole = document.getElementById('outputConsole');
    const primeInput = document.getElementById('primeInput');

    // A large prime number suitable for 256-bit coefficients.
    // This prime (2^256 - 2^32 - 977) is commonly used in cryptography.
    const DEFAULT_LARGE_PRIME = 2n**256n - 2n**32n - 977n;

    // Set default prime value in the input field
    primeInput.value = DEFAULT_LARGE_PRIME.toString();

    // Set default test case inputs
    jsonInput1.value = `{
    "keys": {
        "n": 4,
        "k": 3
    },
    "1": {
        "base": "10",
        "value": "4"
    },
    "2": {
        "base": "2",
        "value": "111"
    },
    "3": {
        "base": "10",
        "value": "12"
    },
    "6": {
        "base": "4",
        "value": "213"
    }
}`;

    jsonInput2.value = `{
    "keys": {
        "n": 10,
        "k": 7
    },
    "1": {
        "base": "6",
        "value": "13444211440455345511"
    },
    "2": {
        "base": "15",
        "value": "aed7015a346d63"
    },
    "3": {
        "base": "15",
        "value": "6aeeb69631c227c"
    },
    "4": {
        "base": "16",
        "value": "e1b5e05623d881f"
    },
    "5": {
        "base": "8",
        "value": "316034514573652620673"
    },
    "6": {
        "base": "3",
        "value": "2122212201122002221120200210011020220200"
    },
    "7": {
        "base": "3",
        "value": "20120221122211000100210021102001201112121"
    },
    "8": {
        "base": "6",
        "value": "20220554335330240002224253"
    },
    "9": {
        "base": "12",
        "value": "45153788322a1255483"
    },
    "10": {
        "base": "7",
        "value": "1101613130313526312514143"
    }
}`;


    runButton.addEventListener('click', () => {
        outputConsole.textContent = ''; // Clear previous output
        let selectedPrime;

        try {
            selectedPrime = BigInt(primeInput.value);
            if (selectedPrime <= 2n) {
                 throw new Error("Prime number must be greater than 2.");
            }
        } catch (error) {
            logToConsole(`Error parsing prime modulus: ${error.message}`);
            return; // Stop execution if prime is invalid
        }

        // Process Test Case 1
        logToConsole(`\n--- Processing Test Case 1 ---`);
        processTestCase(jsonInput1.value, selectedPrime, 'Test Case 1');

        // Process Test Case 2
        logToConsole(`\n--- Processing Test Case 2 ---`);
        processTestCase(jsonInput2.value, selectedPrime, 'Test Case 2');
    });

    /**
     * Processes a single test case, parsing shares and reconstructing the secret.
     * @param {string} jsonString - The JSON string for the test case.
     * @param {bigint} prime - The prime modulus to use for calculations.
     * @param {string} testCaseName - A descriptive name for the test case (e.g., "Test Case 1").
     */
    function processTestCase(jsonString, prime, testCaseName) {
        try {
            const inputData = JSON.parse(jsonString);

            // Extract n and k from the "keys" object
            const n = inputData.keys.n;
            const k = inputData.keys.k;

            if (typeof n !== 'number' || n < 1) {
                throw new Error(`Invalid 'n' in ${testCaseName}: Must be a positive number.`);
            }
            if (typeof k !== 'number' || k < 2 || k > n) {
                throw new Error(`Invalid 'k' in ${testCaseName}: Must be a number >= 2 and <= n.`);
            }

            const sharesToReconstruct = [];
            let validShareCount = 0;

            // Iterate through the inputData to find shares, skipping the 'keys' object
            for (const key in inputData) {
                if (key === "keys") continue; // Skip the metadata object

                const x = BigInt(key); // x is the key of the object (e.g., "1", "2")
                const yData = inputData[key]; // Contains "base" and "value"

                const base = parseInt(yData.base);
                const value = yData.value;

                if (isNaN(base) || base < 2 || base > 36) {
                    logToConsole(`Warning in ${testCaseName}: Invalid base '${yData.base}' for x=${x.toString()}. Skipping this share.`);
                    continue; // Skip this share if base is invalid
                }

                try {
                    const y = decodeYValue(value, base);
                    sharesToReconstruct.push({ x: x, y: y });
                    validShareCount++;
                } catch (decodeError) {
                    logToConsole(`Warning in ${testCaseName}: Could not decode y value '${value}' with base '${base}' for x=${x.toString()}. Error: ${decodeError.message}. Skipping this share.`);
                }
            }

            if (validShareCount < k) {
                logToConsole(`Error in ${testCaseName}: Insufficient valid shares provided (${validShareCount}) to reconstruct secret. Minimum required: ${k}.`);
                return; // Stop processing this test case
            }

            // Sort shares by x-coordinate. While not strictly necessary for Lagrange,
            // it helps with consistent debugging and slicing if only 'k' shares are used.
            sharesToReconstruct.sort((a, b) => Number(a.x - b.x));

            logToConsole(`Shares provided for ${testCaseName} (first ${k} valid shares will be used):`);
            sharesToReconstruct.slice(0, k).forEach(share => { // Only log the 'k' shares that will be used
                logToConsole(`(x=${share.x.toString()}, y=${share.y.toString()})`);
            });

            // Reconstruct the secret (constant term 'c') using exactly 'k' shares
            const secretC = reconstructSecret(sharesToReconstruct.slice(0, k), prime);

            logToConsole(`\nReconstruction successful for ${testCaseName}!`);
            logToConsole(`The constant term 'c' (secret) for ${testCaseName} is: ${secretC.toString()}`);

        } catch (error) {
            logToConsole(`Error processing ${testCaseName}: ${error.message}`);
            logToConsole(`Please ensure the JSON input for ${testCaseName} is correctly formatted.`);
        }
    }

    /**
     * Appends a message to the output console.
     * @param {string} message - The message to log.
     */
    function logToConsole(message) {
        outputConsole.textContent += message + '\n';
        outputConsole.scrollTop = outputConsole.scrollHeight; // Scroll to bottom
    }
});
