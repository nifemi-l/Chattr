// import dependencies
const express = require("express"); // for rest api
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 
const sqlite3 = require("sqlite3").verbose() // db management

// init express app
const app = express()
// create server
const server = http.createServer(app); 
// init websocket server 
const io = new Server (server, { cors: { origin: "*" } });

// init db
const db = new sqlite3.Database("./chat.db");

// use middleware to parse data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

// import path module
const path = require("path");

// serve static files located in the public directory
app.use(express.static(path.join(__dirname, "public")));

// serve index.html for root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// secret key
const JWT_SECRET = "supersecretkey";

// create tables
db.serialize(() => { 
    // table for credentials
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique id for every user
            username TEXT UNIQUE, -- unique user
            password TEXT -- hashed pw
        )
    `);

    // message tables for chats
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            sender_id INTEGER, 
            receiver_id INTEGER, 
            content TEXT, -- msg
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP -- time sent
        )    
    `)
})

// api routes

// new user registration
app.post("register", async (req, res) => {
    const { username, password } = req.body; // get user and pw
    const hashedPassword = await bcrypt(password, 10);
    // insert into db
    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], 
        (err) => { 
            if (err) return res.status(400).json({ error: "User already exists" }); // fail
            res.json({ success: "User registered"}); // success            
        }
    )
});


app.post("/login", (req, res) =>{
    const { username, password } = req.body; 
    // query db for user
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => { 
        if (err || !user) return res.status(400).json({ error: "Invalid credentials" });
        // compare pw
        const isValid = await bcrypt.compare(password, user.password); 
        if (!isValid) return res.status(400).json({ error: "Invalid credentials" });
        // generate JWT token
        const token = jwt.sign({ id: user_id, username: user.username }, JWT_SECRET);
        // resp. with token
        res.json({ token })
    })
})

// websocket event handling

// listen for connection
io.on("connection", (socket) => {
    console.log("User connected");

    // event for sending messages
    socket.on("sendMessage", (data) => {
        // get details from event
        const { senderId, receiverId, content } = data;
        // insert message into db
        db.run(
            "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)", [senderId, receiverId, content], 
            (err) => { 
                if (err) {
                    console.error(err);
                    return;
                }
                // broadcast new message to all other clients except the sender
                socket.broadcast.emit("newMessage", { senderId, receiverId, content });
            }
        );
    });

    // handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
