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
// describe('Edit Profile Route', () => {
//     it('should update user profile and redirect to appropriate dashboard', async () => {
//       const authenticatedAgent = request.agent(app);
//       await authenticatedAgent
//         .post('/login')
//         .send({ email: 'user@example.com', password: 'userpassword' });

//       const res = await authenticatedAgent
//         .post('/edit-profile')
//         .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
//       expect(res.status).toBe(302);
//       expect(res.header.location).toBe('/dashboard'); // Change this to '/admin-dashboard' if user is admin
//     });
//   });


describe('Edit Profile Route', () => {
  test('should update user profile and redirect to appropriate dashboard', async () => {
    // Simulate authentication as a user
    const agent = request.agent(app);
    await agent.post('/login').send({ email: 'user@example.com', password: 'userpassword' });

    // Edit user profile data
    const profileData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    // Attempt to edit user profile
    const res = await agent.post('/edit-profile').send(profileData);

    // Verify the response
    expect(res.status).toBe(302); // Expect a redirect status code
    expect(res.header.location).toBe('/dashboard'); // Expect redirection to user dashboard
  });
});
  