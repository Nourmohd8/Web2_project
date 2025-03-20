require('dotenv').config();
const mongodb = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
let dbClient = new mongodb.MongoClient(MONGO_URI);
let projectDB, userRecords;

async function initializeDB() {
    if (!projectDB) {
        await dbClient.connect();
        projectDB = dbClient.db("WebProject");
        userRecords = projectDB.collection("users");
    }
}

async function addUser(userInfo) {
    await initializeDB();
    const result = await userRecords.insertOne(userInfo);
    return result.insertedId ? true : false;
}

async function findUserByEmail(email) {
    await initializeDB();
    return await userRecords.findOne({ email });
}

module.exports = { addUser, findUserByEmail };
