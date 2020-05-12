var express = require('express')
var router = express.Router();
const {pool} = require('../database')
const moment = require('moment');
const uuid = require('uuid');

router.post('/contact', (req, res) =>{
    const id =  uuid.v4()
    const timestamp = Date.now().toString()
    let date =  moment().format('L')
    var query_str = `INSERT INTO queries (id, name, date, timestamp, email, country, message) VALUES ('${id}','${req.body.name}','${date}','${timestamp}', '${req.body.email}', '${req.body.country}', '${req.body.message}')`
    pool.query(query_str).then(res => {
        console.log( res)
        res.redirect('/documentation')
    }).catch(err => {
        res.redirect('/contact')
        console.log(err.stack);
    })
});

module.exports = router;