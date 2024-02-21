// const request = require('supertest');
// const app = require('../app');
// // const PORT = process.env.PORT || 3000;

// // let server;

// // beforeAll(done => {
// //   // Start the server
// //   server = app.listen(PORT, () => {
// //     console.log(`Server is running on http://localhost:${PORT}`);
// //     done();
// //   });
// // });

// // afterAll(done => {
// //   // Close the server
// //   server.close(done);
// // });

// describe('Add Course Route', () => {
//     test('should add a new course and redirect to admin dashboard', async () => {

//       // Simulate authentication as an admin
//     const agent = request.agent(app);
//     await agent.post('/login').send({ email: 'admin@example.com', password: 'adminpassword' });


//       const courseData = {
//         title: 'New Course',
//         description: 'Description of the new course',
//         contentText: 'Content text',
//         contentUrl: 'https://example.com/content'
//       };

//       const res = await request(app)
//         .post('/add-course')
//         .send(courseData);
//       expect(res.status).toBe(302);
//       expect(res.header.location).toBe('/admin-dashboard');
//     });
//   });
  
const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcrypt');

describe('Add Course Route', () => {
    test('should add a new course and redirect to admin dashboard', async () => {
      // Simulate authentication as an admin
      const agent = request.agent(app);
      const hashedPassword = await bcrypt.hash('adminpassword', 10); 
      console.log("pass : ",hashedPassword);// Hash the password
      await agent.post('/login').send({ email: 'admin@example.com', password: hashedPassword });

      const courseData = {
        title: 'New Course',
        description: 'Description of the new course',
        contentText: 'Content text',
        contentUrl: 'https://example.com/content'
      };

      const res = await agent // Use the authenticated agent
        .post('/add-course')
        .send(courseData);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/admin-dashboard');
    });
});
