import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(), // Formata os logs como JSON
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(), // Formato simples para console
        }),
    ],
});

export class Logger {
    static info(title: string, message?: string, data?: any) {
        logger.info({ title, message, data });
    }

    static error(title: string, message?: string, data?: any) {
        logger.error({ title, message, data });
    }
}