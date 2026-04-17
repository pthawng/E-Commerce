import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { PrismaClient } from '@prisma/client';

async function check() {
    const prisma = new PrismaClient();
    try {
        console.log('Testing connection...');
        await prisma.$connect();
        console.log('Connected.');

        console.log('Checking RefreshToken model...');
        const count = await prisma.refreshToken.count();
        console.log('RefreshToken count:', count);

        console.log('Checking User model...');
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

    } catch (error) {
        console.error('DIAGNOSTIC FAILURE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
