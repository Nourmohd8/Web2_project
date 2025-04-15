const db = require('./persistence');

async function userRegistration(name, email, password, type) {
    return await db.userRegistration(name, email, password, type);
}

async function userAthentication(email, password) {
    const user = await db.userAthentication(email, password);
    if (user) {
        const sessionId = await db.createSession(user._id);
        return { user, sessionId };
    }
    return null;
}

async function getSession(sessionId) {
    return await db.getSession(sessionId);
}

async function getUserById(userId) {
    const database = await db.connectDB();
    return await database.collection('users').findOne({ _id: userId });
}

// // Function to calculate estimated completion time
// function calculateEstimatedCompletion(pendingRequestsCount) {
//     const workStartHour = 8;  // 8 AM
//     const workEndHour = 17;   // 5 PM
//     const requestProcessingTime = 15; // Time taken for each request in minutes
  
//     // Set the starting point: current time
//     let estimatedCompletion = new Date();
  
//     // Add time based on pending requests
//     estimatedCompletion = new Date(estimatedCompletion.getTime() + (pendingRequestsCount * requestProcessingTime * 60000));
  
//     // Ensure estimatedCompletion is within working hours (8 AM - 5 PM)
//     while (estimatedCompletion.getHours() < workStartHour || estimatedCompletion.getHours() >= workEndHour) {
//       estimatedCompletion.setDate(estimatedCompletion.getDate() + 1); // Move to next day
//       estimatedCompletion.setHours(workStartHour, 0, 0, 0);  // Reset to start of working hours (8 AM)
//     }
  
//     return estimatedCompletion;
//   }
  

// async function createCourseRequest(studentId, studentName, courseName) {
//     let count = db.getPendingRequestCount()
//     let estimatedCompletion = calculateEstimatedCompletion(count)
//     return await db.createCourseRequest(studentId, studentName, courseName,estimatedCompletion);
// }

// Function to format date and time in "Day, Date, Month, Year, Time (24-hour)"
function formatDateTime(date) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const month = monthsOfYear[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0'); // 24-hour format
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    return `${dayOfWeek} ${dayOfMonth} ${month} ${year} ${hours}:${minutes}`;
  }
  
  // Function to calculate estimated completion time based on pending requests
  function calculateEstimatedCompletion(pendingRequestsCount) {
    const workStartHour = 8;  // 8 AM
    const workEndHour = 17;   // 5 PM
    const requestProcessingTime = 15; // Time taken for each request in minutes
  
    // Set the starting point: current time
    let estimatedCompletion = new Date();
  
    // Add time based on pending requests
    estimatedCompletion = new Date(estimatedCompletion.getTime() + (pendingRequestsCount * requestProcessingTime * 60000));
  
    // Ensure estimatedCompletion is within working hours (8 AM - 5 PM)
    while (estimatedCompletion.getHours() < workStartHour || estimatedCompletion.getHours() >= workEndHour) {
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 1); // Move to next day
      estimatedCompletion.setHours(workStartHour, 0, 0, 0);  // Reset to start of working hours (8 AM)
    }
  
    return estimatedCompletion;  // Return as valid Date object
  }
  
  
  async function createCourseRequest(studentId, studentName, courseName) {
    const allRequests = await db.getAllCourseRequests();
    const pendingRequestsCount = allRequests.filter(r => r.status === 'pending').length;
  
    // Calculate the estimated completion time
    let estimatedCompletion = calculateEstimatedCompletion(pendingRequestsCount);
  
    // Ensure it's a valid Date object
    if (isNaN(estimatedCompletion.getTime())) {
      estimatedCompletion = new Date(); // Fallback to the current date if it's invalid
    }
  
    // Insert the request with the calculated estimatedCompletion
    return await db.createCourseRequest(studentId, studentName, courseName, estimatedCompletion);
  }
  
  

async function getCourseStats() {
    const dbInstance = await db.connectDB();
    return {
        pending: await dbInstance.collection('courseRequests').countDocuments({ status: "pending" }),
        approved: await dbInstance.collection('courseRequests').countDocuments({ status: "approved" }),
        rejected: await dbInstance.collection('courseRequests').countDocuments({ status: "rejected" })
    };
}

async function submitCourseRequest(request) {
  console.log('Course Request:', request);
    await db.insertCourseEnrollmentRequest(request);
}

async function getAllCourseRequests() {
    return await db.getAllCourseEnrollmentRequests();
}

module.exports = {
    userRegistration,
    userAthentication,
    getSession,
    getUserById,
    deleteSession: db.deleteSession,
    saveRequest: db.saveRequest,
    allRequests: db.getAllRequests,
    createCourseRequest,
    getCourseRequestsForStudent: db.getCourseRequestsForStudent,
    getAllCourseRequests,
    updateCourseRequestStatus: db.updateCourseRequestStatus,
    getCourseStats,
    submitCourseRequest,
    formatDateTime,
    calculateEstimatedCompletion
};
