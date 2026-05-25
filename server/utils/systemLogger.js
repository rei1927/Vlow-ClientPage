import SystemLog from '../models/SystemLog.js';

/**
 * Log a message to the database
 * @param {string} level - 'INFO', 'WARNING', or 'ERROR'
 * @param {string} source - System component (e.g. 'WEBHOOK', 'N8N_API', 'CRM', 'DATABASE')
 * @param {string} message - Descriptive message
 * @param {object} meta - Optional additional JSON data
 */
const logToDb = async (level, source, message, meta = null) => {
  try {
    // Only log if database is connected/synced. 
    // We ignore errors here so it doesn't break the main app flow if logs fail.
    await SystemLog.create({
      level,
      source,
      message,
      meta
    });
  } catch (error) {
    console.error(`[SystemLogger] Failed to write log: ${error.message}`);
  }
};

export const logInfo = (source, message, meta) => logToDb('INFO', source, message, meta);
export const logWarning = (source, message, meta) => logToDb('WARNING', source, message, meta);
export const logError = (source, message, meta) => logToDb('ERROR', source, message, meta);

export default {
  info: logInfo,
  warning: logWarning,
  error: logError
};
