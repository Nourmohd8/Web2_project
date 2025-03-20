require('dotenv').config();
const express = require('express');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const business = require("./business");
const path = require('path');

const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.SECRET_KEY || "your_jwt_secret_key";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve CoreUI and Static Files
app.use(express.static(path.join(__dirname, 'coreui_dist', 'dist')));

// 🟢 Serve Registration Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'coreui_dist', 'dist', 'register.html'));
});

// 🟢 Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'coreui_dist', 'dist', 'login.html'));
});

// 🟢 User Registration
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const success = await business.createUserAccount(username, email, password, role);
        if (success) {
            res.status(201).json({ message: "User registered successfully! Please log in." });
        } else {
            res.status(400).json({ error: "User already exists!" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 🟢 User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log(`Attempting login for: ${email}`);

    try {
        const user = await business.authenticateUser(email, password);

        if (!user) {
            console.log("Authentication failed: Invalid email or password.");
            return res.status(401).json({ error: "Invalid email or password!" });
        }

        console.log("User authenticated:", user.email);

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "2h" });

        res.cookie("authToken", token, { httpOnly: true, secure: false, sameSite: "Strict" });

        res.json({ message: "Login successful!", redirect: user.role === "department_head" ? "/admin" : "/dashboard" });
    } catch (error) {
        console.log("Error during login:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 🟢 Middleware: Authenticate Token
function authenticateToken(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid Token" });
    }
}

// 🟢 Route: Student Dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ error: "Access Denied: Students only!" });
    }
    res.sendFile(path.join(__dirname, 'coreui_dist', 'dist', 'student_dashboard.html'));
});

// 🟢 Route: Department Head Dashboard
app.get('/admin', authenticateToken, (req, res) => {
    if (req.user.role !== "department_head") {
        return res.status(403).json({ error: "Access Denied: Admins only!" });
    }
    res.sendFile(path.join(__dirname, 'coreui_dist', 'dist', 'admin_dashboard.html'));
});

// 🟢 Logout Route
app.post('/logout', (req, res) => {
    res.clearCookie("authToken");
    res.json({ message: "Logged out successfully!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

