const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Activity = require("./models/Activity");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/footlogger")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "All fields are required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ token, username: user.username, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/activities", authMiddleware, async (req, res) => {
  const { name, co2, category, date } = req.body;
  if (!name || !co2 || !category || !date) return res.status(400).json({ message: "All fields are required" });

  try {
    const activity = new Activity({ 
      user: req.userId, 
      name, 
      co2, 
      category, 
      date: new Date(date) 
    });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/activities/:id", authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!activity) return res.status(404).json({ message: "Activity not found" });
    res.json({ message: "Activity deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/activities", authMiddleware, async (req, res) => {
  try {

    const activities = await Activity.find({ user: req.userId }).sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/activities/weekly", authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);

    const userId = new mongoose.Types.ObjectId(req.userId);

    const summary = await Activity.aggregate([
      { 
        $match: { 
          user: userId,
          date: { $gte: lastWeek, $lte: today }
        } 
      },
      { 
        $group: { 
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$date",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            } 
          }, 
          totalCO2: { $sum: "$co2" } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(summary);
  } catch (err) {
    console.error("Weekly summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/activities/average", async (req, res) => {
  try {
    const result = await Activity.aggregate([{ $group: { _id: null, avgCO2: { $avg: "$co2" } } }]);
    const avgCO2 = result[0]?.avgCO2 || 0;
    res.json({ avgCO2 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Activity.aggregate([
      { $group: { _id: "$user", totalCO2: { $sum: "$co2" } } },
      { $sort: { totalCO2: 1 } },
      { $limit: 10 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, username: "$userInfo.username", email: "$userInfo.email", totalCO2: 1 } }
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Footprint Logger API running...");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
