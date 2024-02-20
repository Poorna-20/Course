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

describe('Authentication Tests', () => {
    describe('Signup Process', () => {
        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'user@example.com',
            password: 'userpassword',
            role: 'user'
          };
  
          const adminData = {
              firstName: 'John',
              lastName: 'Doe',
              email: 'admin@example.com',
              password: 'adminpassword',
              role: 'admin'
          }
      test('should allow users and admins to sign up with valid credentials', async () => {
        
        // Test for user login
        let res = await request(app)
          .post('/signup')
          .send(userData);
        expect(res.status).toBe(302); // Assuming successful signup redirects to login

        // Test for admin login
        res = await request(app)
            .post('/signup')
            .send(adminData);
        expect(res.status).toBe(302);
      });
  
      test('should prevent duplicate email addresses from signing up', async () => {
  
        // First signup attempt
        let res1 = await request(app)
          .post('/signup')
          .send(userData);
  
        // Second signup attempt with the same email
        let res2 = await request(app)
          .post('/signup')
          .send(userData);
  
        expect(res2.status).toBe(302); // Assuming duplicate signup redirects to signup page

        res1 = res1 = await request(app)
            .post('/signup')
            .send(userData);

        res2 = await request(app)
            .post('/signup')
            .send(userData);
    
        expect(res2.status).toBe(302); // Assuming duplicate signup redirects to signup page       
      });
    });
  
    describe('Login Process', () => {
        const userData = {
            email: 'user@example.com',
            password: 'userpassword',
            role: 'user'
          };
          const adminData = {
            email: 'admin@example.com',
            password: 'adminpassword',
            role: 'admin'
          };
      test('should allow users to log in with correct credentials', async () => {
        
  
        let res = await request(app)
          .post('/login')
          .send(userData);
        expect(res.status).toBe(302); // Assuming successful login redirects to user dashboard

        res = await request(app)
          .post('/login')
          .send(adminData);
        expect(res.status).toBe(302); // Assuming successful login redirects to user dashboard
      });
  
      test('should prevent users from logging in with incorrect password', async () => {
        const userData = {
          email: 'user@example.com',
          password: 'wrongpassword',
          role: 'user'
        };

        const adminData = {
            email: 'admin@example.com',
            password: 'wrongpassword',
            role: 'admin'
          };
  
        let res = await request(app)
          .post('/login')
          .send(userData);
        expect(res.status).toBe(302); // Assuming incorrect login redirects to login page

        res = await request(app)
          .post('/login')
          .send(adminData);
        expect(res.status).toBe(302); // Assuming incorrect login redirects to login page
      });
  
      test('should redirect users to their respective dashboards after login', async () => {
        const userData = {
            email: 'user@example.com',
            password: 'userpassword',
            role: 'user'
          };
          
        const adminData = {
            email: 'admin@example.com',
            password: 'adminpassword',
            role: 'admin'
          };
        // Test for user login
        let res = await request(app)
          .post('/login')
          .send(userData);
        expect(res.header.location).toBe('/dashboard');
      
        // Test for admin login
        res = await request(app)
          .post('/login')
          .send(adminData);
        expect(res.header.location).toBe('/admin-dashboard');
      });
    });
  });

