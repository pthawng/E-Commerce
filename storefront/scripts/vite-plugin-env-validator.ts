import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Staff+ Enforcement: Vite Build-time Environment Validator.
 * This plugin ensures the build fails early if the environment is incorrect.
 */
const storefrontEnvSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
});

export function envValidator() {
    return {
        name: 'vite-plugin-env-validator',
        configResolved(config: { mode: string; command: string }) {
            // Load .env files based on mode
            const envRoot = path.resolve(__dirname, '../');
            const envPath = path.resolve(envRoot, `.env.${config.mode}`);
            const envLocalPath = `${envPath}.local`;

            // Simplified env loading for validation purposes
            const envFiles = [path.resolve(envRoot, '.env'), envPath, envLocalPath];
            const combinedEnv = { ...process.env };

            envFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const parsed = dotenv.parse(fs.readFileSync(file));
                    Object.assign(combinedEnv, parsed);
                }
            });

            const result = storefrontEnvSchema.safeParse(combinedEnv);

            if (!result.success) {
                console.error('\n❌ [ViteBuildGuard] CRITICAL CONFIG ERROR:');
                result.error.issues.forEach((err) => {
                    console.error(`   - [${err.path.join('.')}] ${err.message}`);
                });
                console.error('\n');

                // Block the build
                if (config.command === 'build') {
                    process.exit(1);
                }
            } else {
                console.log('✅ [ViteBuildGuard] Environment validated successfully.');
            }
        },
    };
}
