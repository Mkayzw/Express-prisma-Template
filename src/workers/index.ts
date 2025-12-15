import logger from '../utils/logger';

// Import workers to register them
import emailWorker from './email.worker';
import cleanupWorker from './cleanup.worker';

const workers = [emailWorker, cleanupWorker];

export const startWorkers = (): void => {
    logger.info(`Starting ${workers.length} workers...`);
    workers.forEach((worker) => {
        logger.info(`Worker "${worker.name}" started`);
    });
};

export const stopWorkers = async (): Promise<void> => {
    logger.info('Stopping all workers...');
    await Promise.all(workers.map((worker) => worker.close()));
    logger.info('All workers stopped');
};

export { emailWorker, cleanupWorker };
