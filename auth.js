const passport = require("passport");
const LocalStrategy = require("passport-local");
const GithubStrategy = require("passport-github2").Strategy;
const ObjectID = require("mongodb").ObjectID;
const bcrypt = require("bcrypt");

module.exports = function (app, myDatabase) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDatabase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  passport.use(
    new LocalStrategy(function (username, password, done) {
      myDatabase.findOne({ username: username }, function (err, user) {
        console.log("User " + username + " attempted to login.");
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );

  // Incomplete code below
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://hidden-spire-68320.herokuapp.com/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        myDatabase.findOne(
          { username: profile.username },
          function (err, user) {
            console.log(
              "Github user " + profile.username + " attempted to login."
            );
            if (err) {
              return done(err);
            } else if (user) {
              return done(null, user);
            } else {
              myDatabase.insertOne(
                { username: profile.username },
                (err, doc) => {
                  if (err) {
                    return done(err);
                  } else {
                    return done(null, doc.ops[0]);
                  }
                }
              );
            }
          }
        );
      }
    )
  );
};
