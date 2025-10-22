import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import resourceController from '../controllers/resource.controller';

const router: RouterType = Router();

/**
 * Resource Routes
 * Base path: /api/v1/resources
 */

// Create a new resource
router.post('/', (req: Request, res: Response, next: NextFunction) => 
  resourceController.create(req, res, next)
);

// List all resources with optional filters
router.get('/', (req: Request, res: Response, next: NextFunction) => 
  resourceController.list(req, res, next)
);

// Get a single resource by ID
router.get('/:id', (req: Request, res: Response, next: NextFunction) => 
  resourceController.getById(req, res, next)
);

// Update a resource by ID
router.put('/:id', (req: Request, res: Response, next: NextFunction) => 
  resourceController.update(req, res, next)
);

// Delete a resource by ID
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => 
  resourceController.delete(req, res, next)
);

export default router;
