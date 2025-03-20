const persistence = require("./persistence");
const bcrypt = require("bcrypt");

async function createUserAccount(username, email, password, role = "student") {
    const existingUser = await persistence.findUserByEmail(email);
    if (existingUser) return false;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user as a JSON object in MongoDB
    const user = { username, email, password: hashedPassword, role, verified: true };

    return await persistence.addUser(user);
}

async function authenticateUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
}

module.exports = { createUserAccount, authenticateUser };
