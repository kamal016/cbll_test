if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express")
const app = express()

const methodOverride = require('method-override')
const routes = require('./routes/home')
const flash = require('express-flash')
const session = require('express-session')

app.use(flash())
app.use(methodOverride('_method'))
app.set('view-engine', 'ejs') //required to send objects to html
app.use(express.urlencoded({extended:false})) // required to read from html we will be able to read fields from register form through post method
app.use(express.static("public")); // required for css file to ejs

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


app.use('/',routes);


//catch 404 and forward to
// app.use(function(req, res, next){
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });


app.listen(3000)