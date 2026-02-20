const prisma = require('../models/prismaClient');

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
};

module.exports = { connectDB, disconnectDB };