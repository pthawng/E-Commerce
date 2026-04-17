import { envSchema as backendSchema } from '../backend/src/config/env.schema';
import { envSchema as frontendSchema } from '../storefront/src/config/env.schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Staff+ Enforcement: Environment Drift Detector.
 * Compares .env.example with the actual schemas to detect missing or unused variables.
 */
function checkDrift(dir: string, schema: any, label: string) {
    const examplePath = path.join(dir, '.env.example');
    if (!fs.existsSync(examplePath)) {
        console.error(`❌ [${label}] .env.example NOT FOUND at ${examplePath}`);
        return false;
    }

    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    const exampleKeys = Object.keys(dotenv.parse(exampleContent));
    const schemaKeys = Object.keys(schema.shape);

    const missingInExample = schemaKeys.filter(k => !exampleKeys.includes(k));
    const extraInExample = exampleKeys.filter(k => !schemaKeys.includes(k) && !k.startsWith('#'));

    let hasError = false;

    if (missingInExample.length > 0) {
        console.error(`❌ [${label}] Missing keys in .env.example (exists in schema but not in example):`);
        missingInExample.forEach(k => console.error(`   - ${k}`));
        hasError = true;
    }

    if (extraInExample.length > 0) {
        console.warn(`⚠️ [${label}] Extra/Unused keys in .env.example (exists in example but not in schema):`);
        extraInExample.forEach(k => console.warn(`   - ${k}`));
    }

    return !hasError;
}

const backendDir = path.resolve(__dirname, '../backend');
const storefrontDir = path.resolve(__dirname, '../storefront');

console.log('🔍 Starting Environment Drift Detection...');

const backendValid = checkDrift(backendDir, backendSchema, 'Backend');
const storefrontValid = checkDrift(storefrontDir, frontendSchema, 'Storefront');

if (!backendValid || !storefrontValid) {
    console.error('\n❌ DRIFT DETECTED: Configuration schemas are out of sync with .env.example files.');
    process.exit(1);
}

console.log('✅ No critical drift detected.');
