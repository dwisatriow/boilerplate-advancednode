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

const routes = require("./routes");
const auth = require("./auth.js");

app.set("view engine", "pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDatabase = await client.db("advancedNodeDB").collection("users");

  routes(app, myDatabase);
  auth(app, myDatabase);

  let currentUsers = 0;

  // eslint-disable-next-line no-unused-vars
  io.on("connection", (socket) => {
    currentUsers++;
    console.log("A user has connected");

    io.emit("user count", currentUsers);
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index", {
      title: e,
      message: "Unable to login",
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
