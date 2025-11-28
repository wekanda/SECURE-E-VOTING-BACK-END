const request = require('supertest');
const app = require('../server');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'candidate',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        role: 'candidate',
        name: 'Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        role: 'candidate',
        name: 'Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          role: 'candidate',
          name: 'Login Test User'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should reject login with invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject login with non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);
    });
  });
});