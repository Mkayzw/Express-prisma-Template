import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db/client';
import bcrypt from 'bcryptjs';

// Mock the queue module
const mockAdd = jest.fn().mockImplementation((name, data) => Promise.resolve({ id: 'mock-job-id', name, data }));
jest.mock('../src/lib/queue', () => ({
  emailQueue: {
    add: mockAdd,
  },
  cleanupQueue: {
    add: mockAdd,
  },
  notificationQueue: {
    add: mockAdd,
  },
}));

describe('Jobs Endpoints', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'Admin',
      },
    });

    // Create regular user
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
        firstName: 'User',
      },
    });

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    userToken = userLogin.body.data.tokens.accessToken;
  });

  afterEach(() => {
    mockAdd.mockClear();
  });

  describe('POST /api/v1/jobs/email', () => {
    it('should add email job with admin token', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const response = await request(app)
        .post('/api/v1/jobs/email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('mock-job-id');
      expect(mockAdd).toHaveBeenCalledWith('send-email', jobData, expect.any(Object));
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        to: 'not-an-email',
        // missing subject and body
      };

      const response = await request(app)
        .post('/api/v1/jobs/email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with regular user token', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await request(app)
        .post('/api/v1/jobs/email')
        .set('Authorization', `Bearer ${userToken}`)
        .send(jobData)
        .expect(403);
    });
  });

  describe('POST /api/v1/jobs/cleanup', () => {
    it('should add cleanup job with admin token', async () => {
      const jobData = {
        type: 'expired_sessions',
        olderThanDays: 30,
      };

      const response = await request(app)
        .post('/api/v1/jobs/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockAdd).toHaveBeenCalledWith('cleanup', jobData, expect.any(Object));
    });

    it('should fail with invalid type', async () => {
      const jobData = {
        type: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/v1/jobs/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
