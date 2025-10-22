import resourceService from '../../services/resource.service';
import Database from '../../database/database';
import { CreateResourceInput, UpdateResourceInput } from '../../models/resource.model';

describe('ResourceService', () => {
  let db: Database;

  beforeAll(() => {
    // Initialize test database
    db = Database.getInstance();
  });

  afterEach(async () => {
    // Clean up database after each test
    const database = db.getDb();
    await new Promise((resolve, reject) => {
      database.run('DELETE FROM resources', (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  });

  afterAll(() => {
    // Close database connection
    db.close();
  });

  describe('create', () => {
    it('should create a new resource successfully', async () => {
      const resourceData: CreateResourceInput = {
        name: 'Test Resource',
        description: 'Test Description',
        category: 'test',
        status: 'active'
      };

      const result = await resourceService.create(resourceData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(resourceData.name);
      expect(result.description).toBe(resourceData.description);
      expect(result.category).toBe(resourceData.category);
      expect(result.status).toBe(resourceData.status);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should create resource with default status when not provided', async () => {
      const resourceData: CreateResourceInput = {
        name: 'Test Resource'
      };

      const result = await resourceService.create(resourceData);

      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });

    it('should create resource with null description when not provided', async () => {
      const resourceData: CreateResourceInput = {
        name: 'Test Resource'
      };

      const result = await resourceService.create(resourceData);

      expect(result).toBeDefined();
      expect(result.description).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Seed test data
      await resourceService.create({ name: 'Electronics Item', category: 'electronics', status: 'active' });
      await resourceService.create({ name: 'Furniture Item', category: 'furniture', status: 'active' });
      await resourceService.create({ name: 'Inactive Item', category: 'electronics', status: 'inactive' });
    });

    it('should list all resources', async () => {
      const result = await resourceService.list();

      expect(result).toHaveLength(3);
    });

    it('should filter resources by category', async () => {
      const result = await resourceService.list({ category: 'electronics' });

      expect(result).toHaveLength(2);
      expect(result.every(r => r.category === 'electronics')).toBe(true);
    });

    it('should filter resources by status', async () => {
      const result = await resourceService.list({ status: 'active' });

      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === 'active')).toBe(true);
    });

    it('should filter resources by name (partial match)', async () => {
      const result = await resourceService.list({ name: 'Electronics' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Electronics');
    });

    it('should filter resources by multiple criteria', async () => {
      const result = await resourceService.list({ 
        category: 'electronics', 
        status: 'active' 
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('electronics');
      expect(result[0].status).toBe('active');
    });

    it('should return empty array when no matches found', async () => {
      const result = await resourceService.list({ category: 'nonexistent' });

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should get resource by ID', async () => {
      const created = await resourceService.create({ 
        name: 'Test Resource',
        description: 'Test'
      });

      const result = await resourceService.getById(created.id!);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
    });

    it('should return null for non-existent ID', async () => {
      const result = await resourceService.getById(99999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    let resourceId: number;

    beforeEach(async () => {
      const created = await resourceService.create({
        name: 'Original Name',
        description: 'Original Description',
        category: 'original',
        status: 'active'
      });
      resourceId = created.id!;
    });

    it('should update resource name', async () => {
      const updateData: UpdateResourceInput = {
        name: 'Updated Name'
      };

      const result = await resourceService.update(resourceId, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.description).toBe('Original Description');
    });

    it('should update multiple fields', async () => {
      const updateData: UpdateResourceInput = {
        name: 'Updated Name',
        status: 'inactive',
        category: 'updated'
      };

      const result = await resourceService.update(resourceId, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.status).toBe('inactive');
      expect(result?.category).toBe('updated');
    });

    it('should update updated_at timestamp', async () => {
      const original = await resourceService.getById(resourceId);
      
      // Wait at least 1 second to ensure timestamp difference (SQLite CURRENT_TIMESTAMP has second precision)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const updateData: UpdateResourceInput = {
        name: 'Updated Name'
      };

      const result = await resourceService.update(resourceId, updateData);

      expect(result).toBeDefined();
      expect(result?.updated_at).not.toBe(original?.updated_at);
    });

    it('should return current resource when no fields to update', async () => {
      const updateData: UpdateResourceInput = {};

      const result = await resourceService.update(resourceId, updateData);

      expect(result).toBeDefined();
      expect(result?.id).toBe(resourceId);
      expect(result?.name).toBe('Original Name');
    });

    it('should return null for non-existent resource', async () => {
      const updateData: UpdateResourceInput = {
        name: 'Updated Name'
      };

      const result = await resourceService.update(99999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing resource', async () => {
      const created = await resourceService.create({ name: 'To Delete' });

      const result = await resourceService.delete(created.id!);

      expect(result).toBe(true);

      const check = await resourceService.getById(created.id!);
      expect(check).toBeNull();
    });

    it('should return false for non-existent resource', async () => {
      const result = await resourceService.delete(99999);

      expect(result).toBe(false);
    });

    it('should actually remove resource from database', async () => {
      const created = await resourceService.create({ name: 'To Delete' });
      
      await resourceService.delete(created.id!);
      
      const allResources = await resourceService.list();
      expect(allResources.find(r => r.id === created.id)).toBeUndefined();
    });
  });
});
