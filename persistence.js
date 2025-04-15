const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const url = 'mongodb+srv://60099846:Nourmohd88@cluster0.mw4po.mongodb.net/';
const dbName = 'finalProject';
const client = new MongoClient(url);




// async function connectDB() {
//     if (!client.topology || !client.topology.isConnected()) {
//         await client.connect();
//     }
//     return client.db(dbName);
// }

async function connectDB() {
  try {
      
      await client.connect();
      console.log('Connected to MongoDB');
      return client.db(dbName);  // Return the database object
  } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      throw new Error('Failed to connect to MongoDB');
  }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function userRegistration(name, email, password, type) {
  const db = await connectDB();
  const users = db.collection('users');
  const existing = await users.findOne({ email });
  if (existing) throw new Error('Email already registered');

  const user = {
      name,
      email,
      password: hashPassword(password),
      type
  };

  await users.insertOne(user);
  return user;
}

async function userAthentication(email, password) {
    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user || user.password !== hashPassword(password)) return null;
    return user;
}

async function createSession(userId) {
    const db = await connectDB();
    const sessions = db.collection('sessions');
    const sessionId = crypto.randomBytes(16).toString('hex');
    const session = { sessionId, userId: new ObjectId(userId), createdAt: new Date() };
    await sessions.insertOne(session);
    return sessionId;
}

async function getSession(sessionId) {
    const db = await connectDB();
    return await db.collection('sessions').findOne({ sessionId });
}

async function deleteSession(sessionId) {
    const db = await connectDB();
    await db.collection('sessions').deleteOne({ sessionId });
}


// Adding the new function here
// function getEstimatedCompletionTimeFromQueue(positionInQueue, requestDate = new Date()) {
//     const TASK_DURATION_MINUTES = 15;
//     const WORK_START_HOUR = 8;
//     const WORK_END_HOUR = 15;
//     const WEEKEND_DAYS = [5, 6]; // Friday (5), Saturday (6)

//     let date = new Date(requestDate);

//     const isWeekend = (d) => WEEKEND_DAYS.includes(d.getDay());

//     const moveToNextWorkday = (d) => {
//         do {
//             d.setDate(d.getDate() + 1);
//         } while (isWeekend(d));
//         d.setHours(WORK_START_HOUR, 0, 0, 0);
//         return d;
//     };

//     // Normalize start time
//     if (isWeekend(date) || date.getHours() < WORK_START_HOUR || date.getHours() >= WORK_END_HOUR) {
//         date = moveToNextWorkday(date);
//     }

//     let minutesToAdd = positionInQueue * TASK_DURATION_MINUTES;

//     while (minutesToAdd > 0) {
//         if (isWeekend(date)) {
//             date = moveToNextWorkday(date);
//             continue;
//         }

//         if (date.getHours() < WORK_START_HOUR) {
//             date.setHours(WORK_START_HOUR, 0);
//         } else if (date.getHours() >= WORK_END_HOUR) {
//             date = moveToNextWorkday(date);
//             continue;
//         }

//         const endOfDay = new Date(date);
//         endOfDay.setHours(WORK_END_HOUR, 0, 0, 0);
//         const availableToday = (endOfDay - date) / 60000;

//         const minutesThisSession = Math.min(minutesToAdd, availableToday);
//         date.setMinutes(date.getMinutes() + minutesThisSession);
//         minutesToAdd -= minutesThisSession;
//     }

//     // Format to DD-MM-YYYY hh:mm AM/PM
//     const pad = (n) => String(n).padStart(2, '0');
//     const day = pad(date.getDate());
//     const month = pad(date.getMonth() + 1);
//     const year = date.getFullYear();

//     let hours = date.getHours();
//     const minutes = pad(date.getMinutes());
//     const ampm = hours >= 12 ? 'PM' : 'AM';

//     hours = hours % 12;
//     hours = hours ? hours : 12; // 0 → 12

//     return `${day}-${month}-${year} ${pad(hours)}:${minutes} ${ampm}`;
// }

async function getPendingCount() {
    const db = await connectDB();
    const count = await db.collection('requests').countDocuments({ status: 'pending' });
    return count;
}

async function saveRequest(userId, username, requestType, reason) {
    const db = await connectDB();
    pendingcount = await db.collection('requests').countDocuments({ status: 'pending' });
    await db.collection('requests').insertOne({
        userId: userId,
        username,
        requestType,
        reason,
        status: "pending",
        timestamp: String(new Date()),
        estimatedProcessingTime: getEstimatedCompletionTimeFromQueue(pendingcount, new Date())
    });
}

async function userRequest(userId) {
    const db = await connectDB();
    return await db.collection('requests').find({ userId: userId }).sort({ _id: -1 }).toArray();
}

async function getAllRequests(){
    const db = await connectDB();
    const requests = await db.collection('requests')
        .find({})
        .sort({ _id: -1 })
        .toArray();

    return requests
}


async function createCourseRequest(studentId, studentName, courseName,estimatedCompletion) {
  const db = await connectDB();
  await db.collection('courseRequests').insertOne({
    studentId: new ObjectId(studentId),
    studentName,
    courseName,
    status: 'pending',
    createdAt: new Date(),
    estimatedCompletion: estimatedCompletion
  });
}

async function getCourseRequestsForStudent(studentId) {
  const db = await connectDB();
  return await db.collection('courseRequests')
    .find({ studentId: new ObjectId(studentId) })
    .toArray();
}

async function getAllCourseRequests() {
  const db = await connectDB();
  return await db.collection('courseRequests').find({}).sort({ createdAt: -1 }).toArray();
}

async function updateCourseRequestStatus(id, status) {
  const db = await connectDB();
  await db.collection('courseRequests').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );
}



async function insertCourseEnrollmentRequest(request) {
  const db = await connectDB();

  // Ensure correct fields are used and stored as Date objects
  await db.collection('courseRequests').insertOne({
    studentName: request.studentName,
    courseName: request.courseName,
    status: request.status,
    submittedAt: new Date(request.submittedAt),  // Save with correct field name
    estimatedCompletion: new Date(request.estimatedCompletion)  // Save with correct field name
  });
}
  


async function getAllCourseEnrollmentRequests() {
  const db = await connectDB();
  return await db.collection('courseRequests').find().toArray();
}



module.exports = {
    connectDB,
    userRegistration,
    userAthentication,
    createSession,
    getSession,
    deleteSession,
    saveRequest,
    userRequest,
    getAllRequests,
    getPendingCount,
    createCourseRequest,
    getCourseRequestsForStudent,
    getAllCourseRequests,
    updateCourseRequestStatus,
    getAllCourseEnrollmentRequests,
    insertCourseEnrollmentRequest
};