import Database from '../database/database';
import { Resource, ResourceFilter, CreateResourceInput, UpdateResourceInput } from '../models/resource.model';

interface RunResult {
  lastID: number;
  changes: number;
}

/**
 * ResourceService - Handles all database operations for resources
 */
class ResourceService {
  private db = Database.getInstance().getDb();

  /**
   * Create a new resource
   */
  create(resource: CreateResourceInput): Promise<Resource> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO resources (name, description, category, status)
        VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        resource.name,
        resource.description || null,
        resource.category || null,
        resource.status || 'active'
      ];

      this.db.run(query, params, function(this: RunResult, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        
        // Return the created resource with its ID
        const selectQuery = 'SELECT * FROM resources WHERE id = ?';
        Database.getInstance().getDb().get(selectQuery, [this.lastID], (err: Error | null, row: Resource) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        });
      });
    });
  }

  /**
   * List all resources with optional filters
   */
  list(filters?: ResourceFilter): Promise<Resource[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM resources WHERE 1=1';
      const params: (string | number)[] = [];

      // Apply filters
      if (filters?.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters?.name) {
        query += ' AND name LIKE ?';
        params.push(`%${filters.name}%`);
      }

      query += ' ORDER BY created_at DESC';

      this.db.all(query, params, (err: Error | null, rows: Resource[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Get a single resource by ID
   */
  getById(id: number): Promise<Resource | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM resources WHERE id = ?';
      
      this.db.get(query, [id], (err: Error | null, row?: Resource) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  /**
   * Update a resource by ID
   */
  update(id: number, resource: UpdateResourceInput): Promise<Resource | null> {
    return new Promise((resolve, reject) => {
      // Build dynamic update query based on provided fields
      const fields: string[] = [];
      const params: (string | number)[] = [];

      if (resource.name !== undefined) {
        fields.push('name = ?');
        params.push(resource.name);
      }

      if (resource.description !== undefined) {
        fields.push('description = ?');
        params.push(resource.description);
      }

      if (resource.category !== undefined) {
        fields.push('category = ?');
        params.push(resource.category);
      }

      if (resource.status !== undefined) {
        fields.push('status = ?');
        params.push(resource.status);
      }

      if (fields.length === 0) {
        // No fields to update, return current resource
        this.getById(id).then(resolve).catch(reject);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE resources SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(query, params, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // Return the updated resource
        this.getById(id).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Delete a resource by ID
   */
  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM resources WHERE id = ?';
      
      this.db.run(query, [id], function(this: RunResult, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        // Return true if a row was deleted, false otherwise
        resolve(this.changes > 0);
      });
    });
  }
}

export default new ResourceService();
