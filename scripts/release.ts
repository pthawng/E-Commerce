import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Release strategy automation.
 * Ensures consistent versioning, tagging, and deployment readiness.
 */
function release() {
    const versionType = process.argv[2] || 'patch';
    const validTypes = ['patch', 'minor', 'major'];

    if (!validTypes.includes(versionType)) {
        console.error(`❌ Invalid version type. Use: ${validTypes.join(', ')}`);
        process.exit(1);
    }

    const packageJsonPath = path.resolve(__dirname, '../backend/package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;

    console.log(`🚀 Starting release from ${oldVersion} (${versionType})...`);

    try {
        // Ensure clean git state
        const status = execSync('git status --porcelain').toString();
        if (status) {
            console.error('❌ Git workspace is not clean. Commit or stash changes first.');
            process.exit(1);
        }

        // Bump version using npm (handles package.json and package-lock.json)
        // Note: Running in backend dir
        execSync(`cd backend && npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

        const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const newVersion = newPackageJson.version;
        const tag = `v${newVersion}`;

        // Commit and Tag
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'inherit' });
        execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });

        console.log(`\n✅ Release ${tag} created successfully.`);
        console.log(`👉 Run 'git push origin main --tags' to trigger the Delivery pipeline.`);

    } catch (error) {
        console.error('❌ Release failed:', error.message);
        process.exit(1);
    }
}

release();
