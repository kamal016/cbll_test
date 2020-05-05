const bcrypt = require("bcrypt");
const passport = require('passport');
var express = require('express');
var router = express.Router();
const flash = require('express-flash');
const querystring = require('querystring');
const uuid = require('uuid');
const moment = require('moment');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const initializePassport = require('../passport-config');
initializePassport (passport)

router.use(passport.initialize())
router.use(passport.session())

router.use(express.json());

const {pool} = require('../database')

/* Get About Page */

router.get('/', function(req, res){
  res.render('home.ejs', {currentUser : req.user});
});

router.post('/register', checkNotAuthenticated, async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const username = req.body.username
    const email = req.body.email
    const company = req.body.company
    const timestamp = Date.now().toString()
    // client.connect()
    var query_str = `INSERT INTO users (username, email,password,company, created_on) VALUES ('${username}', '${email}', '${hashedPassword}', '${company}', '${timestamp}')`
    pool.query(query_str).then(res => {
        console.log( res)
    }).catch(err => {
        res.redirect('/register')
        console.log(err.stack);
    }).finally(() => {            
        res.redirect('/login')
        // client.end()
})
})


router.get('/login', checkNotAuthenticated,(req, res) => {
    res.render('login.ejs')
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))  

router.get('/register',checkNotAuthenticated, (req, res) =>{
    res.render('register.ejs')
})

router.get('/home', (req, res) =>{
    
    res.render('home.ejs')
})

router.get('/contact', (req, res) =>{
    res.render('contact.ejs',{currentUser : req.user})
})
router.post('/contact', (req, res) =>{
    res.render('home.ejs',{currentUser : req.user})
})

router.get('/account',checkAuthenticated, (req, res) =>{
    res.render('account.ejs',{currentUser : req.user})
})

router.get('/pricing', (req, res) =>{
    res.render('pricing.ejs' ,{currentUser : req.user})
})

router.get('/documentation', (req, res) =>{
    res.render('documentation.ejs',{currentUser : req.user})
})

router.get('/faqs', (req, res) =>{
    res.render('faqs.ejs',{currentUser : req.user})
})

router.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

//GET Checkout
router.get('/checkout', checkAuthenticated, (req, res) => {
    if (req.user.isPaid) {
        req.flash('success', 'Your account is already paid');
        return res.redirect('/account');
    }    
    var reverseQuery = querystring.parse(req.query.go)
    res.render('checkout.ejs', { amount: reverseQuery.pay, invoiceId: reverseQuery.invoiceId });

});




// use query string to pass invoice and price value to checkout
router.get('/invoice',  checkAuthenticated, (req, res) => {
  var invoiceId= 'CBLL'+Math.floor(Math.random()*Math.pow(10,7));
  var pay = req.query.pay;
  var query_now = querystring.escape(querystring.stringify({'pay': pay,'invoiceId': invoiceId}))
  res.redirect('/checkout?go='+ query_now)
});


// POST pay
router.post('/pay', checkAuthenticated, async (req, res) => {
    req.user.isPaid = true;

    const { paymentMethodId, items, currency, amountPay, invoiceId} = req.body;
    const amount = amountPay * 100;
    let description = 'Software development services'
    let name = 'Kamal Thakur' 
    let addressLine1 = '510 Townsend St'
    let postalCode = '98140'
    let city = 'San Francisco'
    let state = 'CA'
    let country = 'US'
    
  
    try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        error_on_requires_action: true,
        confirm: true,
        description: description,
        shipping: {
            name: name,
            address: {
              line1: addressLine1,
              postal_code: postalCode,
              city: city,
              state: state,
              country: country,
            },
          },
       });
      
      // console.log("💰 Payment received!");
      
      const startTimestamp = Date.now().toString()
      const endTimestamp = (parseInt(startTimestamp) +  15897600000).toString() // 6 months add
      const id = req.user.id
      const apiKey  = uuid.v4()
      const paymentStatus = 'paid'

      if(amountPay<20){
        var availableCalls  = 50000
        var remainingCalls = 50000
      }
      else if (amountPay>40){
        var availableCalls  = 500000
        var remainingCalls = 500000
      }
      
      const billingDate = moment().format('L')
      const expiringDate = moment().add(6, "months").format('L')

      var queryStr = `INSERT INTO details (id, api_key, invoice_id, payment_status, amount_paid, available_calls, remaining_calls, start_timestamp, end_timestamp, billing_date, expiring_date)
                       VALUES ('${id}', '${apiKey}', '${invoiceId}', '${paymentStatus}', '${amountPay}', '${availableCalls}','${remainingCalls}','${startTimestamp}','${endTimestamp}','${billingDate}','${expiringDate}' )`

      pool.query(queryStr).then(response => {
          console.log( response)
          res.send({ clientSecret: intent.client_secret });
      }).catch(err => {
        console.log(err.stack);
        res.send({error: "Database connection failed. Please try again later."});
      })

      // await req.user.save();
      // The payment is complete and the money has been moved
      // You can add any post-payment code here (e.g. shipping, fulfillment, etc)
  
      // Send the client secret to the client to use in the demo
      // res.send({ clientSecret: intent.client_secret });
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
      // See https://stripe.com/docs/declines/codes for more
      if (e.code === "authentication_required") {
        res.send({error: "This card requires authentication in order to proceeded. Please use a different card."});
      } else {
        res.send({ error: e.message });
      }
    }
});



function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login')
  }
  
function checkNotAuthenticated(req, res, next) {
if (req.isAuthenticated()) {
    return res.redirect('/')
}
next()
}

module.exports = router;