const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Starting Prisma Sync Bridge...');
    const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf8' });
    fs.writeFileSync('prisma_sync_success.log', output);
    console.log('Prisma Sync Succeeded!');
} catch (error) {
    fs.writeFileSync('prisma_sync_error.log', error.stdout + '\n' + error.stderr);
    console.error('Prisma Sync Failed!');
    process.exit(1);
}
