// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config()
// }

// const express = require("express")
// const app = express()

// const methodOverride = require('method-override')
// const routes = require('./routes/home')
// const contact = require('./routes/contact')

// const session = require('express-session')


// app.use(methodOverride('_method'))
// app.set('view-engine', 'ejs') //required to send objects to html
// app.use(express.urlencoded({extended:false})) // required to read from html we will be able to read fields from register form through post method
// app.use(express.static("public")); // required for css file to ejs

// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false
// }))


// app.use('/',routes);
// app.use('/',contact);

// //catch 404 and forward to
// // app.use(function(req, res, next){
// //     var err = new Error('Not Found');
// //     err.status = 404;
// //     next(err);
// // });




// app.listen(3000)

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
        let myArray = []
        let index = []
        var query_str = `select * from cities`
        pool.query(query_str).then(response => {
            response.rows.forEach(element => {
                let newValue = Object.values(element)
                let nearestValue = Math.sqrt(Math.pow((newValue[4] - lat),2) + Math.pow((newValue[5] - long),2))
                myArray.push([newValue[4], newValue[5], nearestValue])
                index.push(nearestValue)
            });

            let minIndex = Math.min(...index)
            let indexNumber = index.findIndex( index => index === minIndex)
            let nearestLat = myArray[indexNumber][0]
            let nearestLong = myArray[indexNumber][1]
            console.log(nearestLat, nearestLong)

            let queryForFinalSearch = `SELECT * FROM cities where lat = '${nearestLat}' and long = '${nearestLong}'`
            pool.query(queryForFinalSearch).then(response => {
                console.log(response.rows[0])
            });
            // console.log(Math.pow(8, 2) );
            // let lat_long = [[20.0000, 50.00],[25.0210, 54.00014], [24.123,64.201 ]];
            // console.log(lat_long);
            // let test = [25.000, 53.0000]
            
            // lat_long.forEach(Element=>{
            //     // a.findIndex( a => a === Math.min(...a))
            //     // kk = Math.min(...a)
            //     // a.findIndex( a => a === kk)
            //   console.log(Math.sqrt(Math.pow((Element[0] - test[0]),2) + Math.pow((Element[1] - test[1]),2)))
            // })

        }).catch(err => {
            res.redirect('/contact')
            console.log(err.stack);
        })
    }
    catch(err){
        console.log(err);
    }
    

});

// catch 404 and forward to
// app.use(function(req, res, next){
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

app.listen(3000)