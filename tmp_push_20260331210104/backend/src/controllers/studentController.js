const Student = require("../models/Student");
const jwt = require("jsonwebtoken");

// register a new student/user
async function register(req, res) {
  try {
    const { rollNumber, name, email, password, degree, year } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const student = new Student({
      studentId: rollNumber,
      rollNumber,
      name,
      email,
      password,
      degree,
      year,
      role: "student",
    });
    await student.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// login and get token
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await Student.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login };
