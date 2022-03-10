"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const routes = require("./routes");
const auth = require("./auth.js");

app.set("view engine", "pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

myDB(async (client) => {
  const myDatabase = await client.db("advancedNodeDB").collection("users");

  routes(app, myDatabase);
  auth(app, myDatabase);

  let currentUsers = 0;

  // eslint-disable-next-line no-unused-vars
  io.on("connection", (socket) => {
    currentUsers++;
    io.emit("user", {
      name: socket.request.user.name,
      currentUsers,
      connected: true,
    });
    console.log("user " + socket.request.user.name + " connected");

    socket.on("disconnect", (socket) => {
      currentUsers--;
      io.emit("user", {
        name: socket.request.user.name,
        currentUsers,
        connected: false,
      });
      console.log("user " + socket.request.user.name + " disconnected");
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index", {
      title: e,
      message: "Unable to login",
    });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log("Successful connection to socket.io");
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
