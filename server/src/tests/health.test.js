const request = require('supertest');
const app = require('../app');

describe('Health Check API', () => {
    it('should return 200 and a success message', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Zoho Invoice Clone API is running 🚀');
    });
});
