require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { User } = require("./models/user");
const { Log } = require("./models/log");
const cors = require('cors')

const app = express();
app.use(bodyParser.json());
app.use(cors());

const client = mongoose
  .connect(process.env.dbURI)
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));

//middleweres from bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Route to create a new user
app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;

    // Check if a user with the same username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(username + " already exists");
      return res.json({ error: "User already exists" });
    }

    // Create a new user if none exists
    const newUser = new User({ username });

    await newUser.save();

    //logging the object responded from the call
    console.log({
      username: newUser.username,
      _id: newUser._id,
    });
    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Route to get all users
app.get("/api/users", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    //logging the object responded from the call
    console.log("LOGGING USERS - " + users);
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to add a log to a user
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    console.log("LOGGING EXERCISES");
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    // Find the user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create and save new log
    const newLog = new Log({
      userID: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });

    console.log(newLog);
    await newLog.save();

    //logging the object responded from the call
    console.log({
      _id: user._id,
      username: user.username,
      date: newLog.date.toDateString(),
      duration: newLog.duration,
      description: newLog.description,
    });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      date: newLog.date.toDateString(),
      duration: newLog.duration,
      description: newLog.description,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//retrieveing a full exercise log of any user.
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userID = req.params._id;
    const { from, to, limit } = req.query;

    
    console.log("LOGGING ALL THE EXERCISE LOGS for id: " + userID);
    const logs = await Log.find({ userID }).select('-_id -userID -__v');;
    const user = await User.findById(userID);
    if (logs.length === 0) {
      return res.status(404).json({ error: "No logs found for this user" });
    }

    // Transform logs and response
    const transformedLogs = logs.map(log => {
      return {
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString() // Format date as a readable string
      };
    });

    const response = {
      _id: user._id,
      username: user.username,
      count: transformedLogs.length,
      log: transformedLogs
    };

    // Return the logs
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
