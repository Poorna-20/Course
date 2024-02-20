const request = require('supertest');
const app = require('../server');
const PORT = 3000;

let server;

beforeAll(done => {
  // Start the server
  server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    done();
  });
});

afterAll(done => {
  // Close the server
  server.close(done);
});

describe('Add Course Route', () => {
    it('should add a new course and redirect to admin dashboard', async () => {
      const res = await request(app)
        .post('/add-course')
        .send({ title: 'New Course', description: 'Description of the new course', content_text: 'Content text', content_url: 'Content URL' })
        .set('Cookie', ['user=adminObject']); // Set admin cookie for authentication
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/admin-dashboard');
    });
  });
  