require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { User } = require("./models/user");
const { Log } = require("./models/log");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect(process.env.dbURI)
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));

//middleweres from bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.static("public"));

//main page
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

    res.json(users);
  } catch (error) {
    res.json({ error: error.message });
  }
});


// Route to add a log to a user
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    // Find the user
    const user = await User.findById(_id);
    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Create and save new log
    const newLog = new Log({
      userID: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });
    await newLog.save();

    //return a response
    res.json({
      _id: user._id,
      username: user.username,
      date: newLog.date.toDateString(),
      duration: newLog.duration,
      description: newLog.description,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});


//retrieveing a full exercise log of any user.
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    //defining veriables
    const userID = req.params._id;
    const { from, to, limit } = req.query;
    const user = await User.findById(userID);
    let logs;

    // no optional parameters has been specified,
    if (from === undefined && to === undefined && limit === undefined) {
      logs = await Log.find({ userID });
      console.log(logs);
    } else {

    //mongoDB should ignore the date option if from and to are undefined apperently it didnt happend needs more studing about it 
    //dividing to two cases : dates are defined or not defined at all
    if (from !== undefined || to !== undefined) {
      logs = await Log.find({
        userID: userID,
        date: {
          $gte: from,
          $lte: to,
        },
      })
        .limit(limit)
        .select("-_id -userID -__v");//remove these properties from found documents
    } else {
      logs = await Log.find({
        userID: userID,
      })
        .limit(limit)
        .select("-_id -userID -__v");
    }
  }

    if (typeof logs == "undefined" || logs.length === 0) {
      return res.json({ error: "No logs found for this user" });
    }

    // constructing valid response
    const transformedLogs = logs.map((log) => {
      return {
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString(), // Format date as a readable string
      };
    });
    const response = {
      _id: user._id,
      username: user.username,
      count: transformedLogs.length,
    };
    if (from !== undefined) Object.assign(response, { from: from });
    if (to !== undefined) Object.assign(response, { to: to });
    response.log = transformedLogs;
    console.log(response);


    // Return the logs respons
    res.json(response);
  } catch (error) {
    res.json({ error: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
