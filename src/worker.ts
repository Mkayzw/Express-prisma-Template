import { closeAllQueues } from './lib/queue';
import { startWorkers, stopWorkers } from './workers';
import { prisma } from './db/client';
import RedisClient from './lib/redis';
import logger from './utils/logger';

async function startWorkerProcess() {
    try {
        // Connect to database
        await prisma.$connect();
        logger.info('Worker connected to database');

        // Connect to Redis
        await RedisClient.connect();
        logger.info('Worker connected to Redis');

        // Start all workers
        startWorkers();
        logger.info('Worker process started');

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, shutting down worker process`);

            try {
                await stopWorkers();
                await closeAllQueues();
                await prisma.$disconnect();
                await RedisClient.disconnect();
                logger.info('Worker process shutdown complete');
                process.exit(0);
            } catch (error) {
                logger.error('Error during worker shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start worker process:', error);
        process.exit(1);
    }
}

startWorkerProcess();
