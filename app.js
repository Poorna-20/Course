const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
// const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

// Set up body-parser and session middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));


const sequelize = new Sequelize('lms_db_dev', 'postgres', '12345', {
  host: 'localhost',
  dialect: 'postgres'
});

const User = sequelize.define('User', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'Users',
});

const Course = sequelize.define('Course', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  addedBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'Courses',
});

const CourseContent = sequelize.define('CourseContent', {
  text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'CourseContents',
});

const Enrollment = sequelize.define('Enrollment', {
  // userId: {
  //   type: DataTypes.INTEGER,
  //   allowNull: false,
  // },
  // courseId: {
  //   type: DataTypes.INTEGER,
  //   allowNull: false,
  // }
}, {
  tableName: 'Enrollments',
});

Course.hasMany(CourseContent, { foreignKey: 'courseId', as: 'contents' });
CourseContent.belongsTo(Course, { foreignKey: 'courseId' });


Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

User.hasMany(Enrollment, { foreignKey: 'userId' });
Enrollment.belongsTo(User, { foreignKey: 'userId' });

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js to use a local strategy for authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    // If user not found or password doesn't match, return false
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return done(null, false);
    }


    // If authentication succeeds, return the user object
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize user object to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user object from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user  && req.user.role === 'admin') {
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
  const { firstName, lastName, email, password, role } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.redirect('/signup');
    }

    await User.create({ firstName, lastName, email, password: hashedPassword, role });

    res.redirect('/login');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
}),(req,res)=>{
  if (req.user.role === 'admin'){
    res.redirect('/admin-dashboard');
  }
  else{
    res.redirect('/dashboard');
  }
});

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

app.get('/profile', isAuthenticated, async (req, res) => {
  try {

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    const currentUserRole = await User.findOne({ attributes: ['role'], where: { id: userId } });

    res.render('edit-profile', { user, currentUser: currentUserRole ? currentUserRole.role : null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/edit-profile', isAuthenticated, async (req, res) => {
  try {

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.render('edit-profile', { user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/edit-profile', isAuthenticated, async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const userId = req.user.id;

  try {

    await User.update({ firstName, lastName, email }, { where: { id: userId } });

    const currentUserRole = await User.findOne({ attributes: ['role'], where: { id: userId } });

    if (currentUserRole) {
      if (currentUserRole.role === 'admin') {
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
  try {

    const courses = await Course.findAll();

    res.render('admin-dashboard', { user: req.user, courses });
  } catch (error) {
    res.status(500), json({ message: error.message })
  }

});

app.post('/add-course', isAdmin, async (req, res) => {
  const { title, description, contentText, contentUrl } = req.body;

  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    const course = await Course.create({ title, description, addedBy: user.firstName });
    if (!course) {
      return res.status(500).json({ message: 'Failed to create course' });
    }
    await CourseContent.create({ courseId: course.id, text: contentText, url: contentUrl });

    res.redirect('/admin-dashboard');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/course/:courseId', isAuthenticated, async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.user.id;

  try {
    const course = await Course.findByPk(courseId, { include: { model: CourseContent, as:	"contents" } });
    const isEnrolled = await Enrollment.findOne({ where: { userId, courseId } });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const userRole = await User.findOne({ where: { id: userId } });

    res.render('course-page', { user: req.user, course, isEnrolled: !!isEnrolled, userRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/enroll-course', isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    console.log(userId);
    // Validate courseId
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid courseId' });
    }

    const existingEnrollment = await Enrollment.findOne({ where: { userId, courseId } });

    if (!existingEnrollment) {
      await Enrollment.create({ userId, courseId });
    }
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {

    const courses = await Course.findAll();

    const userId = req.user.id;


    const enrolledCourses = await Enrollment.findAll({
      where: { userId },
      include: { model: Course }
    });
    console.log(enrolledCourses);

    res.render('dashboard', { user: req.user, enrolledCourses, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/admin-dashboard', isAdmin, async (req, res) => {
  try {

    const courses = await Course.findAll();

    res.render('admin-dashboard', { user: req.user, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


module.exports = app;