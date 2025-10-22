import App from './app';

/**
 * Server Entry Point
 * Initialize and start the Express application
 */
const app = new App();
app.listen();

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
