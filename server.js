if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express")
const app = express()

const methodOverride = require('method-override')
const routes = require('./routes/home')
const contact = require('./routes/contact')
const flash = require('express-flash')
const session = require('express-session')
const {pool} = require('./database')

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
app.use('/',contact);

app.get('/query', (req, res) =>{
    console.log("working fine!!!!!!")
    try{
        let lat = req.query.lat;
        let long = req.query.long;
        res.send('Done ->' + lat +  " -----" + long)    

        var query_str = `INSERT INTO queries (id, name, date, timestamp, email, country, message) VALUES ('${id}','${req.body.name}','${date}','${timestamp}', '${req.body.email}', '${req.body.country}', '${req.body.message}')`
        pool.query(query_str).then(response => {
            console.log( response)
            res.redirect('/documentation')
        }).catch(err => {
            res.redirect('/contact')
            console.log(err.stack);
        })
    }
    catch(err){
        console.log(err);
    }
    

});

//catch 404 and forward to
// app.use(function(req, res, next){
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

app.listen(3000)