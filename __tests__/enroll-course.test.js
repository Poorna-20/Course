const request = require('supertest');
const app = require('../app');
// const PORT = process.env.PORT || 3000;

// let server;

// beforeAll(done => {
//   // Start the server
//   server = app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
//     done();
//   });
// });

// afterAll(done => {
//   // Close the server
//   server.close(done);
// });
describe('Enroll Course Route', () => {
  test('should enroll user in a course and redirect to dashboard', async () => {
    // Simulate authentication as a user
    const agent = request.agent(app);
    await agent.post('/login').send({ email: 'user@example.com', password: 'userpassword' });

    // Attempt to enroll in a course
    const res = await agent.post('/enroll-course').send({ courseId: 'courseID' });

    // Verify the response
    expect(res.status).toBe(302); // Expect a redirect status code
    expect(res.header.location).toBe('/dashboard'); // Expect redirection to user dashboard
  });
});
  