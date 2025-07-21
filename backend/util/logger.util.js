// Enhanced logger utility with file and line number for better traceability
// Usage: logger.info('message'); logger.error('error message');
import winston from 'winston';

function getFileLine() {
  const stack = new Error().stack;
  if (!stack) return '';
  const lines = stack.split('\n');
  // The 4th line in the stack trace is usually the caller
  if (lines.length > 3) {
    const match = lines[3].match(/\((.*):(\d+):(\d+)\)/);
    if (match) {
      return `[${match[1]}:${match[2]}]`;
    }
  }
  return '';
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}]${getFileLine()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});