const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server);

const user = {};

const mongoURI =
  "mongodb+srv://anitsaha976:zuzFOFhJY5EYscLA@cluster0.6nmeso4.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

const consumerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatarImage: String,
  messages: [
    {
      text: String,
      sender: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Consumer = mongoose.model("Consumer", consumerSchema);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/login.css", (req, res) => {
  res.sendFile(path.join(__dirname, "login.css"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/login.js", (req, res) => {
  res.sendFile(path.join(__dirname, "login.js"));
});

app.get("/js/client.js", (req, res) => {
  res.sendFile(path.join(__dirname, "js", "client.js"));
});

app.get("/logo.png", (req, res) => {
  res.sendFile(path.join(__dirname, "/img/logo.png"));
});

app.get("/image1.png", (req, res) => {
  res.sendFile(path.join(__dirname, "/img/image1.png"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("userJoined", (username) => {
    user[socket.id] = username;
    io.emit("userJoined", username);
    socket.emit("showCont");
    io.emit("updateContUsername", username);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    delete user[socket.id];
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email already exists in the database
    const existingConsumer = await Consumer.findOne({ email });

    if (existingConsumer) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newConsumer = new Consumer({
      name,
      email,
      password: hashedPassword,
    });
    await newConsumer.save();
    res.status(201).json({ message: "Consumer registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const consumer = await Consumer.findOne({ email });

    if (!consumer) {
      res.status(401).send("Invalid email");
    } else if (!(await bcrypt.compare(password, consumer.password))) {
      res.status(401).send("Invalid password");
    } else {
      loggedInUser = consumer.name;
      res.cookie("userIdentifier", email, { maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).send("An error occurred");
  }
});

app.get("/getLoggedInUserName", (req, res) => {
  if (loggedInUser) {
    console.log("Logged-in user's name:", loggedInUser);
    res.json({ name: loggedInUser });
  } else {
    res.status(404).json({ message: "No user logged in" });
  }
});

app.post("/saveMessage", async (req, res) => {
  const { username, message } = req.body;

  try {
    const consumer = await Consumer.findOne({ name: username });
    if (consumer) {
      consumer.messages.push({ text: message, sender: username });
      await consumer.save();
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Consumer not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});

app.get("/getSavedMessages", async (req, res) => {
  try {
    const consumers = await Consumer.find({}, "name messages").lean();

    const allMessages = [];

    consumers.forEach((consumer) => {
      consumer.messages.forEach((message) => {
        allMessages.push({
          username: consumer.name,
          text: message.text,
          timestamp: message.timestamp,
        });
      });
    });

    // Sort messages by timestamp in ascending order
    const sortedMessages = allMessages.sort(
      (a, b) => a.timestamp - b.timestamp
    );

    console.log("Server retrieved messages:", sortedMessages);
    res.json(sortedMessages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

app.post("/updateAvatarImage", async (req, res) => {
  const { imageURL } = req.body;

  try {
    // Assuming you have a consumer entry already identified by some ID
    const consumerId = "your-consumer-id";
    const updatedConsumer = await Consumer.findByIdAndUpdate(
      consumerId,
      { avatarImage: imageURL },
      { new: true }
    );

    res.json({ message: "Avatar image updated", consumer: updatedConsumer });
  } catch (error) {
    res.status(500).json({ error: "Error updating avatar image" });
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
