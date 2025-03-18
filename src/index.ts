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

// Health check endpoint
// @ts-ignore
app.get('/healthz', (_req, res) => {
  res.status(200).send({
    status: isRunning ? 'running' : 'initializing',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Start the express server
app.listen(PORT, () => {
  logger.formatInfo("main", `Health check server listening on port ${PORT}`);
});

async function main() {
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
    
    return result;
  } catch (e) {
    logger.formatError("main", (e as Error).message);
    process.exit(1);
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
main().catch(e => {
  logger.formatError("main", e.message);
  process.exit(1);
});