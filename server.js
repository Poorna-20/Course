const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lms',
  password: 'postgre1',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname,"public")));

app.use(session({
  secret: 'b97166529585db2bbb62cc449c7ba36a',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production if using HTTPS
}));

function authenticateUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Routes for Signup, Login, and Logout

app.get('/', (req, res) => {
  res.render('signup');
});

app.get('/signup', (req, res) => {
  res.render('signup');
}); 

app.post('/signup', async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  try {
    
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.redirect('/signup');
    }

    await pool.query('INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5)', [firstname, lastname, email, hashedPassword, role]);

    res.redirect('/login');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch && user.role === role) {
        req.session.user = user;
        if (role === 'admin') {
          res.redirect('/admin-dashboard');
        } else {
          res.redirect('/dashboard');
        }
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});

app.get('/profile',authenticateUser,async (req,res)=>{
  try {
    
    const userId = req.session.user.user_id;
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    currentUser = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);

    res.render('edit-profile', { user: user.rows[0] , currentUser : currentUser.rows[0].role});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})
// Route to display the user profile edit page
app.get('/edit-profile', authenticateUser, async (req, res) => {
  try {
    
    const userId = req.session.user.user_id;
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    res.render('edit-profile', { user: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to handle the profile edit form submission
app.post('/edit-profile', authenticateUser, async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const userId = req.session.user.user_id;

  try {
    
    await pool.query('UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE user_id = $4', [
      firstName,
      lastName,
      email,
      userId
    ]);
  
    currentUser = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    // console.log(currentUser);
  
    
    if (currentUser.rows && currentUser.rows.length > 0) {
      if (currentUser.rows[0].role === 'admin') {
        res.redirect('/admin-dashboard');
      } else {
        res.redirect('/dashboard');
      }
    } else {
      
      console.error('Error: currentUser.row is undefined or empty');
      res.status(500).json({ message: 'Internal server error' });
    }
  
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
});



app.get('/add-course', isAdmin, async (req, res) => {
  try{

    const courses = await pool.query('SELECT * FROM courses');

    res.render('admin-dashboard', { user: req.session.user , courses:courses });
  } catch(error){
    res.status(500),json({message:error.message})
  }
  
});

// Route for handling the addition of a new course
app.post('/add-course', isAdmin, async (req, res) => {
  const { title, description,content_text,content_url } = req.body;

  const userId = req.session.user.user_id;


  try {
    const user = await pool.query('SELECT first_name FROM users WHERE user_id = $1', [userId]);
    const addedBy = user.rows[0].first_name;
    // console.log(addedBy)


    const result = await pool.query('INSERT INTO courses (title, description, added_by) VALUES ($1, $2, $3) RETURNING course_id ', [title, description, addedBy]);
    const courseID = result.rows[0].course_id;
    
    await pool.query('INSERT INTO course_content (course_id , text , url) VALUES ($1, $2, $3)',[courseID, content_text, content_url])


    
    res.redirect('/admin-dashboard');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to display individual course content
app.get('/course/:courseId', authenticateUser, async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.session.user.user_id;

  try {
    
    const courseDetails = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);

    
    const isEnrolled = await pool.query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]);

    const courseContent = await pool.query('SELECT * FROM course_content WHERE course_id = $1', [courseId]);
    
    const userRole = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);

    // console.log("Course Content:", courseContent);

    // Render the course content page with details and enrollment status
    res.render('course-page', { user: req.session.user, course: courseDetails.rows[0], isEnrolled: isEnrolled.rows.length > 0 , content: courseContent.rows[0],userRole : userRole.rows[0]});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/enroll-course', authenticateUser, async (req, res) => {
  const { courseId } = req.body;
  const userId = req.session.user.user_id;

  try {
    
    const existingEnrollment = await pool.query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]);

    if (existingEnrollment.rows.length === 0) {
      

      await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)', [userId, courseId]);
    }

    
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected routes

app.get('/dashboard', authenticateUser, async(req, res) => {
  try {
    
    const courses =  await pool.query('SELECT * FROM courses');

    const userId = req.session.user.user_id;

    
    const enrolledCourses = await pool.query('SELECT courses.* FROM courses JOIN enrollments ON courses.course_id = enrollments.course_id WHERE enrollments.user_id = $1', [userId]);

    
    res.render('dashboard', { user: req.session.user, enrolledCourses: enrolledCourses.rows , courses: courses.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/admin-dashboard', isAdmin, async(req, res) => {
  try {
   
    const courses = await pool.query('SELECT * FROM courses');
    
    res.render('admin-dashboard', { user: req.session.user, courses: courses.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
