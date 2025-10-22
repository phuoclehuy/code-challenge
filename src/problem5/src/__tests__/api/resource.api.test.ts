import request from 'supertest';
import App from '../../app';
import Database from '../../database/database';

describe('Resource API Endpoints', () => {
  let app: App;
  let server: any;

  beforeAll(() => {
    app = new App();
    server = app.app;
  });

  afterEach(async () => {
    // Clean up database after each test
    const db = Database.getInstance().getDb();
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM resources', (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  });

  afterAll(() => {
    Database.getInstance().close();
  });

  describe('POST /api/v1/resources', () => {
    it('should create a new resource', async () => {
      const resourceData = {
        name: 'Test Resource',
        description: 'Test Description',
        category: 'electronics',
        status: 'active'
      };

      const response = await request(server)
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(resourceData.name);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Resource created successfully');
    });

    it('should return 400 when name is missing', async () => {
      const resourceData = {
        description: 'Test Description'
      };

      const response = await request(server)
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(400);

      expect(response.body.error).toBe('Name is required');
    });

    it('should return 400 when name is empty string', async () => {
      const resourceData = {
        name: '   '
      };

      const response = await request(server)
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(400);

      expect(response.body.error).toBe('Name is required');
    });

    it('should create resource with default status', async () => {
      const resourceData = {
        name: 'Test Resource'
      };

      const response = await request(server)
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body.data.status).toBe('active');
    });
  });

  describe('GET /api/v1/resources', () => {
    beforeEach(async () => {
      // Seed test data
      await request(server).post('/api/v1/resources').send({ name: 'Resource 1', category: 'electronics', status: 'active' });
      await request(server).post('/api/v1/resources').send({ name: 'Resource 2', category: 'furniture', status: 'active' });
      await request(server).post('/api/v1/resources').send({ name: 'Resource 3', category: 'electronics', status: 'inactive' });
    });

    it('should list all resources', async () => {
      const response = await request(server)
        .get('/api/v1/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    it('should filter resources by category', async () => {
      const response = await request(server)
        .get('/api/v1/resources?category=electronics')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((r: any) => r.category === 'electronics')).toBe(true);
    });

    it('should filter resources by status', async () => {
      const response = await request(server)
        .get('/api/v1/resources?status=active')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((r: any) => r.status === 'active')).toBe(true);
    });

    it('should filter resources by name', async () => {
      const response = await request(server)
        .get('/api/v1/resources?name=Resource 1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Resource 1');
    });

    it('should filter by multiple criteria', async () => {
      const response = await request(server)
        .get('/api/v1/resources?category=electronics&status=active')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      const response = await request(server)
        .get('/api/v1/resources?category=nonexistent')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/resources/:id', () => {
    let resourceId: number;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/v1/resources')
        .send({ name: 'Test Resource', description: 'Test' });
      
      resourceId = response.body.data.id;
    });

    it('should get resource by ID', async () => {
      const response = await request(server)
        .get(`/api/v1/resources/${resourceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(resourceId);
      expect(response.body.data.name).toBe('Test Resource');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(server)
        .get('/api/v1/resources/99999')
        .expect(404);

      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(server)
        .get('/api/v1/resources/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid resource ID');
    });
  });

  describe('PUT /api/v1/resources/:id', () => {
    let resourceId: number;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/v1/resources')
        .send({ 
          name: 'Original Name',
          description: 'Original Description',
          category: 'original',
          status: 'active'
        });
      
      resourceId = response.body.data.id;
    });

    it('should update resource successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        status: 'inactive'
      };

      const response = await request(server)
        .put(`/api/v1/resources/${resourceId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.status).toBe('inactive');
      expect(response.body.message).toBe('Resource updated successfully');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(server)
        .put('/api/v1/resources/99999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(server)
        .put('/api/v1/resources/invalid')
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.error).toBe('Invalid resource ID');
    });

    it('should update only provided fields', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(server)
        .put(`/api/v1/resources/${resourceId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Original Description');
      expect(response.body.data.category).toBe('original');
    });
  });

  describe('DELETE /api/v1/resources/:id', () => {
    let resourceId: number;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/v1/resources')
        .send({ name: 'To Delete' });
      
      resourceId = response.body.data.id;
    });

    it('should delete resource successfully', async () => {
      const response = await request(server)
        .delete(`/api/v1/resources/${resourceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Resource deleted successfully');

      // Verify resource is actually deleted
      await request(server)
        .get(`/api/v1/resources/${resourceId}`)
        .expect(404);
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(server)
        .delete('/api/v1/resources/99999')
        .expect(404);

      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(server)
        .delete('/api/v1/resources/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid resource ID');
    });
  });

  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('Server is running');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(server)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('/api/v1/nonexistent');
    });
  });
});
