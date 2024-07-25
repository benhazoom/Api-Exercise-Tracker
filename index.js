require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { User } = require('./models/user');
const { Log } = require('./models/log');

const app = express();
app.use(bodyParser.json());

const client = mongoose
  .connect(process.env.dbURI)
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));

//middleweres from bodyParser
// app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Route to create a new user
// Route to create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to add a log to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    // Find the user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create and save new log
    const newLog = new Log({
      userID: user._id,
      description,
      duration,
      date: new Date(date)
    });

    await newLog.save();

    // Include the username in the response
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
``



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
