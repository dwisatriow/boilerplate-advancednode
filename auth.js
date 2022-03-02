const passport = require("passport");
const LocalStrategy = require("passport-local");
const GithubStrategy = require("passport-github").Strategy;
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

  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://hidden-spire-68320.herokuapp.com/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        myDatabase.findAndModify(
          { id: profile.id },
          {},
          {
            $setOnInsert: {
              id: profile.id,
              username: profile.username,
              name: profile.displayName || "John Doe",
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            console.log(
              "Github user " + profile.username + " attempted to login."
            );
            return done(null, doc.value);
          }
        );
      }
    )
  );
};
