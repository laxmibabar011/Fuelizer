// Enhanced logger utility with file and line number for better traceability
// Usage: logger.info('message'); logger.error('error message');
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function getFileLine() {
  const stack = new Error().stack.split('\n')[3];
  const match = stack.match(/\((.*):(\d+):(\d+)\)/);
  if (match) {
    const [, file, line, col] = match;
    return `${path.basename(file)}:${line}`;
  }
  return '';
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] [${getFileLine()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'info.log'), level: 'info' }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});