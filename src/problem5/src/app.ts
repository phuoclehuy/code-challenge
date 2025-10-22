import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import resourceRoutes from './routes/resource.routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import Database from './database/database';

// Load environment variables
dotenv.config();

/**
 * Express Application Setup
 */
class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    // Initialize database
    Database.getInstance();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Configure middleware
   */
  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);
  }

  /**
   * Configure routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'OK', message: 'Server is running' });
    });

    // API v1 routes
    this.app.use('/api/v1/resources', resourceRoutes);
  }

  /**
   * Configure error handling
   */
  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`API endpoint: http://localhost:${this.port}/api/v1/resources`);
    });
  }
}

export default App;
