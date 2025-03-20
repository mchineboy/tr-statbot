import 'source-map-support/register';
import StatBot from "./statbot";
import * as logger from "./lib/util/console-helper";
// @ts-ignore
import express from 'express';

// Create an express app for health checks
const app = express();
const PORT = process.env.PORT || 8080;

// Global variables to store our StatBot instances
let listeners: any[] = [];
let patreonPoll: NodeJS.Timeout;
let isRunning = false;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;

// Process-wide uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.formatError("main", `Uncaught exception: ${error.message}`);
  console.error(error.stack);
  
  if (restartAttempts < MAX_RESTART_ATTEMPTS) {
    restartAttempts++;
    logger.formatInfo("main", `Attempting to restart StatBot (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`);
    
    // Clean up existing resources
    if (listeners && listeners.length) {
      listeners.forEach(listener => {
        if (listener.patronSubscription) {
          listener.patronSubscription.unsubscribe();
        }
      });
    }
    
    if (patreonPoll) {
      clearInterval(patreonPoll);
    }
    
    // Restart after a short delay
    setTimeout(() => {
      logger.formatInfo("main", "Restarting StatBot now...");
      startBot();
    }, 5000);
  } else {
    logger.formatError("main", `Max restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting...`);
    process.exit(1);
  }
});

// Process-wide unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.formatError("main", `Unhandled promise rejection: ${reason}`);
  // Let the uncaught exception handler deal with it by forcing an exception
  throw reason;
});

// Health check endpoint
// @ts-ignore
app.get('/healthz', (_req, res) => {
  res.status(200).send({
    status: isRunning ? 'running' : 'initializing',
    uptime: process.uptime(),
    timestamp: Date.now(),
    restartAttempts
  });
});

// Heartbeat endpoint to see last bot activity
// @ts-ignore
app.get('/heartbeat', (_req, res) => {
  res.status(200).send({
    lastActivity: new Date().toISOString(),
    isRunning,
    listeners: listeners.length,
    uptime: process.uptime()
  });
});

// Start the express server
app.listen(PORT, () => {
  logger.formatInfo("main", `Health check server listening on port ${PORT}`);
});

async function startBot() {
  logger.formatInfo("main", "Statbot starting @ " + new Date().toUTCString());
  
  try {
    // Start the StatBot
    const result = await StatBot();
    // @ts-ignore
    listeners = result[0];
    patreonPoll = result[1];
    isRunning = true;
    
    logger.formatInfo("main", "Statbot running and listening for events");
    
    // Set up graceful shutdown
    setupShutdown();
    
    // Reset restart attempts counter on successful startup
    if (restartAttempts > 0) {
      logger.formatInfo("main", "Restart successful, resetting counter");
      restartAttempts = 0;
    }
    
    // Set up a periodic health check to ensure listeners are functioning
    setInterval(() => {
      if (listeners.some(l => !l.isListening())) {
        logger.formatWarn("main", "Some listeners are not active, restarting them...");
        listeners.forEach(l => {
          if (!l.isListening()) {
            l.listen();
          }
        });
      }
    }, 60000); // Check every minute
    
    return result;
  } catch (e) {
    logger.formatError("main", (e as Error).message);
    throw e; // Let the uncaught exception handler deal with it
  }
}

function setupShutdown() {
  // Handle process termination signals
  process.on('SIGTERM', () => cleanupAndExit('SIGTERM'));
  process.on('SIGINT', () => cleanupAndExit('SIGINT'));
  
  function cleanupAndExit(signal: string) {
    logger.formatInfo("main", `Received ${signal}, shutting down...`);
    
    // Clean up resources
    if (listeners && listeners.length) {
      listeners.forEach(listener => {
        if (listener.patronSubscription) {
          listener.patronSubscription.unsubscribe();
        }
      });
    }
    
    if (patreonPoll) {
      clearInterval(patreonPoll);
    }
    
    logger.formatInfo("main", "Cleanup complete, exiting");
    process.exit(0);
  }
}

// Start the bot
startBot().catch(e => {
  logger.formatError("main", `Failed to start StatBot: ${e.message}`);
  process.exit(1);
});