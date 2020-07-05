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
        let key = req.query.key;
        console.log(lat,long, key)
        // res.send('Done ->' + lat +  " -----" + long)    
        let myArray = []
        let index = []

        var validateKeyQuery = `select remaining_calls, end_timestamp from details where api_key = '${key}'`
        pool.query(validateKeyQuery).then(response =>{
            // console.log(response.rows[0])
            let remainingCalls = response.rows[0].remaining_calls
            let endTimestamp = response.rows[0].end_timestamp

            //Checking if user is valid or not. comparing remaining calls and timestamp for validity date.
            if(remainingCalls > 0 && endTimestamp > Date.now()){
                console.log('right');
                var query_str = `select * from cities`;
                pool.query(query_str).then(response => {
                    response.rows.forEach(element => {
                        let newValue = Object.values(element);
                        let nearestValue = Math.sqrt(Math.pow((newValue[4] - lat),2) + Math.pow((newValue[5] - long),2));
                        myArray.push([newValue[4], newValue[5], nearestValue]);
                        index.push(nearestValue);
                    });
        
                    let minIndex = Math.min(...index);
                    let indexNumber = index.findIndex( index => index === minIndex);
                    let nearestLat = myArray[indexNumber][0];
                    let nearestLong = myArray[indexNumber][1];
        
                    let queryForFinalSearch = `SELECT * FROM cities where lat = '${nearestLat}' and long = '${nearestLong}'`;
                    pool.query(queryForFinalSearch).then(response => {
                        console.log(response.rows[0]);
                        res.send(response.rows[0]);
                        
                        let newRemainingCalls = remainingCalls - 1;
                        // console.log('Remaining Calls : ', remainingCalls , newRemainingCalls)
                        let updateQuery = `update details set remaining_calls = ${newRemainingCalls}  where api_key = '${key}'`
                        pool.query(updateQuery).then(response => {
                            console.log('Updated Remaining Calls')
                        });

                    });
        
                }).catch(err => {
                    // res.redirect('/contact')
                    res.send('Error');
                    console.log(err.stack);
                })
            }
            else{
                console.log('Wrong');
                res.send('Error : Invalid user');
            }
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