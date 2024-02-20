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
describe('Enroll Course Route', () => {
    it('should enroll user in a course and redirect to dashboard', async () => {
        const authenticatedAgent = request.agent(app);
        await authenticatedAgent
          .post('/login')
          .send({ email: 'user@example.com', password: 'userpassword' });
  
        const res = await authenticatedAgent
          .post('/enroll-course')
          .send({ courseId: 'courseID' });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/dashboard');
    });
  });
  