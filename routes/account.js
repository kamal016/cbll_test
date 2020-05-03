var express = require('express')
var app = express.Router();

app.get('/dashboard', function(req, res){
    var kk  = 'okay so its working'
    
});

router.get('/', function(req, res){
    res.render('home.ejs', {currentUser : req.user});
});

