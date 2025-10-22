import { Request, Response, NextFunction } from 'express';
import resourceService from '../services/resource.service';
import { CreateResourceInput, UpdateResourceInput, ResourceFilter } from '../models/resource.model';

/**
 * ResourceController - Handles HTTP requests for resource operations
 */
class ResourceController {
  /**
   * Create a new resource
   * POST /api/resources
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resourceData: CreateResourceInput = req.body;

      // Basic validation
      if (!resourceData.name || resourceData.name.trim() === '') {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const resource = await resourceService.create(resourceData);
      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all resources with optional filters
   * GET /api/resources?category=xxx&status=xxx&name=xxx
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ResourceFilter = {
        category: req.query.category as string,
        status: req.query.status as string,
        name: req.query.name as string
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ResourceFilter] === undefined) {
          delete filters[key as keyof ResourceFilter];
        }
      });

      const resources = await resourceService.list(filters);
      res.status(200).json({
        success: true,
        data: resources,
        count: resources.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single resource by ID
   * GET /api/resources/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid resource ID' });
        return;
      }

      const resource = await resourceService.getById(id);

      if (!resource) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a resource by ID
   * PUT /api/resources/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid resource ID' });
        return;
      }

      const updateData: UpdateResourceInput = req.body;

      // Check if resource exists
      const existingResource = await resourceService.getById(id);
      if (!existingResource) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      const updatedResource = await resourceService.update(id, updateData);
      res.status(200).json({
        success: true,
        data: updatedResource,
        message: 'Resource updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a resource by ID
   * DELETE /api/resources/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid resource ID' });
        return;
      }

      const deleted = await resourceService.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ResourceController();
