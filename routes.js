const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDatabase) {
    app.route('/')
    .get((req, res) => {
      res.render(
        process.cwd() + '/views/pug/index', {
          title: 'Connected to database',
          message: 'Please login',
          showLogin: true,
          showRegistration: true
        }
      );
    });

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile')
    });

  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render(process.cwd() + '/views/pug/profile', {
        username: req.user.username
      });
    });

  app.route('/logout')
    .get((req, res) => {
      req.logout;
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12);

      myDatabase.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/')
        } else {
          myDatabase.insertOne({ username: req.body.username, password: hash }, (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0])
            }
          });
        }
      });
    },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => {
        res.redirect('/profile');
      }
    );

  app.use((req, res) => {
    res.status(404)
      .type('text')
      .send('Not found');
  })
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}