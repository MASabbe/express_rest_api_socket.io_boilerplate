"use strict";
import winston from "winston";
import { env } from "./vars";
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: './logs/error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: './logs/combined.log'
        }),
    ],
});
if (env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
        handleExceptions: true
    }));
}
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
export default logger;