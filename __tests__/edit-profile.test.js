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
describe('Edit Profile Route', () => {
    it('should update user profile and redirect to appropriate dashboard', async () => {
      const authenticatedAgent = request.agent(app);
      await authenticatedAgent
        .post('/login')
        .send({ email: 'user@example.com', password: 'userpassword' });

      const res = await authenticatedAgent
        .post('/edit-profile')
        .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/dashboard'); // Change this to '/admin-dashboard' if user is admin
    });
  });
  