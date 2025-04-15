const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const business = require('./business');
const { ObjectId } = require('mongodb');

const app = express();

const hbs = exphbs.create({
    helpers: {
        eq: (a, b) => a === b
    }
});


const { formatDateTime, createCourseRequest } = require('./business');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
        const session = await business.getSession(sessionId);
        if (session) {
            req.user = await business.getUserById(session.userId);
        } else {
            res.clearCookie('sessionId');
        }
    }
    next();
});

app.get('/', (req, res) => res.render('home'));
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));


app.post('/register', async (req, res) => {
  const { name, email, password, type } = req.body;
  try {
      await business.registerUser(name, email, password, type);
      res.redirect('/login');
  } catch (e) {
      res.render('register', { error: e.message, name, email, type });
  }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await business.authenticateUser(email, password);
    if (result) {
        res.cookie('sessionId', result.sessionId, { httpOnly: true });
        res.redirect(result.user.type === 'admin' ? '/adminDashboard' : '/studentDashboard');
    } else {
        res.send('Login failed');
    }
});




// // GET: Admin Dashboard
// app.get('/adminDashboard', async (req, res) => {
//   if (!req.user || req.user.type !== 'admin') return res.send("Unauthorized");
//   const stats = await getRequestStats();
//   const allRequests = await business.allRequests();
//   res.render('adminDashboard', { stats, allRequests });
// });
  
// app.get('/newRequest', (req, res) => {
//     if (!req.user || req.user.type !== 'student') return res.send("Unauthorized");
//     res.render('newRequest');
// });

// app.post('/submitRequest', async (req, res) => {
//     if (!req.user || req.user.type !== 'student') return res.send("Unauthorized");
//     const { requestType, reason } = req.body;
//     await business.saveRequest(req.user._id, req.user.name, requestType, reason);

//     res.redirect('/studentDashboard');
// });


app.get('/studentDashboard', async (req, res) => {
  if (!req.user || req.user.type !== 'student') return res.send("Unauthorized");
  const courseRequests = await business.getCourseRequestsForStudent(req.user._id);
  res.render('studentDashboard', {
    name: req.user.name,
    courseRequests
  });
});



// app.get('/adminDashboard', async (req, res) => {
//   if (!req.user || req.user.type !== 'admin') return res.send("Unauthorized");
//   const courseRequests = await business.getAllCourseRequests();
//   res.render('adminDashboard', { courseRequests });
// });

app.get('/adminDashboard', async (req, res) => {
  const courseRequests = await business.getAllCourseRequests();
  const stats = await business.getCourseStats();

  // Format the dates using the business layer's formatDateTime function
  const formattedRequests = courseRequests.map(req => ({
    ...req,
    submittedAt: req.submittedAt ? formatDateTime(new Date(req.submittedAt)) : 'Not set',
    estimatedCompletion: req.estimatedCompletion ? formatDateTime(new Date(req.estimatedCompletion)) : 'Not set'
  }));

  res.render('adminDashboard', { courseRequests: formattedRequests, stats });
});

app.get('/newRequest', (req, res) => {
  if (!req.user || req.user.type !== 'student') return res.send("Unauthorized");
  res.render('newRequest');
});

app.post('/submitRequest', async (req, res) => {
  if (!req.user || req.user.type !== 'student') return res.send("Unauthorized");
  const { requestType, reason } = req.body;
  console.log(req.body)
  await business.saveRequest(req.user._id, req.user.name, requestType, reason);
  res.redirect('/studentDashboard');
});

app.post('/submitCourseRequest', async (req, res) => {
  const { studentName, courseName } = req.body;

  // Submit time (this will be automatically set)
  const submittedAt = new Date();  

  // Create course request and save it with the estimated completion
  await createCourseRequest(studentName, courseName);

  res.redirect('/adminDashboard');
});


  

app.get('/logout', (req, res) => {
  res.clearCookie('sessionToken');
  res.render('logout');  
});
  

// // POST: View Random Request
// app.post('/admin/randomRequest', async (req, res) => {
//   const db = await require('./persistenceLayer').connectDB();
//   const requests = await db.collection('requests').find({}).toArray();
//   if (requests.length === 0) {
//     return res.render('adminDashboard', { stats: await getRequestStats(), randomRequest: null });
//   }
//   const random = requests[Math.floor(Math.random() * requests.length)];
//   res.render('adminDashboard', { stats: await getRequestStats(), randomRequest: random });
// });

// POST: Auto Approve Capstone Requests
app.post('/admin/autoApproveCapstone', async (req, res) => {
  const db = await require('./persistenceLayer').connectDB();
  await db.collection('requests').updateMany(
    { requestType: "Capstone", status: "pending" },
    { $set: { status: "approved" } }
  );
  res.redirect('/adminDashboard');
});

// Helper to get stats
app.post('/enrollCourse', async (req, res) => {
  const { courseName } = req.body;
  await business.createCourseRequest(req.user._id, req.user.name, courseName);
  res.redirect('/studentDashboard');
});




app.post('/approveCourse/:id', async (req, res) => {
  await business.updateCourseRequestStatus(req.params.id, 'approved');
  res.redirect('/adminDashboard');
});

app.post('/rejectCourse/:id', async (req, res) => {
  await business.updateCourseRequestStatus(req.params.id, 'rejected');
  res.redirect('/adminDashboard');
});




app.listen(8000, () => console.log("Server running on http://localhost:8000"));
