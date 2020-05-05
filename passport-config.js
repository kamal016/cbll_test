const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const {pool} = require('./database')

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
      
      var query_str = `Select * from users where email = '${email}'`
      
      pool.query(query_str).then(res => {
        var data = res.rows[0]
        var pg_password = data['password']
          if (pg_password.length > 0) {
                try {
                    if (bcrypt.compare(password, pg_password)) {
                      return done(null, { id: data.id, username: data.username, company: data.company })
                    } else {
                      return done(null, false, { message: 'Password incorrect' })
                    }
                }catch (e) {
                  return done(e)
                }
              }
            }).catch(err => {
                console.log(err);
                return done(null, false, { message: 'No user with that email' })
            })
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user))
    passport.deserializeUser((user, done) => done(null, user))

  }

module.exports = initialize