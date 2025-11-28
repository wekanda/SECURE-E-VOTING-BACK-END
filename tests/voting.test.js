const request = require('supertest');
const app = require('../server');
const { query } = require('../config/database');

describe('Voting Endpoints', () => {
  let ballotToken;
  let adminToken;

  beforeAll(async () => {
    // Ensure test voter exists
    await query('INSERT OR IGNORE INTO eligible_voters (reg_no, name, email) VALUES (?, ?, ?)', ['REG0001', 'Test Voter', 'test@example.com']);

    // Login as admin to create test data
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@evoting.com',
        password: 'admin123'
      });

    adminToken = adminLogin.body.token;

    // Create a test position
    await request(app)
      .post('/api/positions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Position',
        seats: 1,
        opens_at: new Date().toISOString(),
        closes_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    // Get ballot token through verification
    const otpRequest = await request(app)
      .post('/api/verify/request-otp')
      .send({ reg_no: 'REG0001' });

    const otpResponse = await request(app)
      .post('/api/verify/verify-otp')
      .send({
        verification_id: otpRequest.body.verification_id,
        otp: otpRequest.body.otp
      });

    ballotToken = otpResponse.body.ballot_token;
  });

  describe('GET /api/voting/ballot', () => {
    it('should get ballot with valid token', async () => {
      const response = await request(app)
        .get('/api/voting/ballot')
        .set('ballot-token', ballotToken)
        .expect(200);

      expect(response.body.positions).toBeDefined();
      expect(Array.isArray(response.body.positions)).toBe(true);
    });

    it('should reject request without ballot token', async () => {
      await request(app)
        .get('/api/voting/ballot')
        .expect(401);
    });

    it('should reject request with invalid ballot token', async () => {
      await request(app)
        .get('/api/voting/ballot')
        .set('ballot-token', 'invalid-token')
        .expect(403);
    });
  });

  describe('POST /api/voting/vote', () => {
    it('should cast vote with valid ballot token', async () => {
      // First get the ballot to see available candidates
      const ballotResponse = await request(app)
        .get('/api/voting/ballot')
        .set('ballot-token', ballotToken);

      const position = ballotResponse.body.positions[0];
      if (position && position.candidates && position.candidates.length > 0) {
        const votes = [{
          position_id: position.id,
          candidate_id: position.candidates[0].id
        }];

        const response = await request(app)
          .post('/api/voting/vote')
          .set('ballot-token', ballotToken)
          .send({ votes })
          .expect(200);

        expect(response.body.message).toBe('Vote cast successfully');
        expect(response.body.ballot_id).toBeDefined();
      }
    });

    it('should reject vote without ballot token', async () => {
      const votes = [{
        position_id: 1,
        candidate_id: 1
      }];

      await request(app)
        .post('/api/voting/vote')
        .send({ votes })
        .expect(401);
    });

    it('should reject empty vote array', async () => {
      await request(app)
        .post('/api/voting/vote')
        .set('ballot-token', ballotToken)
        .send({ votes: [] })
        .expect(400);
    });
  });

  describe('Double Vote Prevention', () => {
    it('should prevent voting twice with same token', async () => {
      // This test assumes the previous vote test consumed the token
      const votes = [{
        position_id: 1,
        candidate_id: 1
      }];

      await request(app)
        .post('/api/voting/vote')
        .set('ballot-token', ballotToken)
        .send({ votes })
        .expect(400);
    });
  });
});