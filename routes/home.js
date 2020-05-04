const bcrypt = require("bcrypt")
const passport = require('passport')
var express = require('express')
var router = express.Router();
const flash = require('express-flash')
const querystring = require('querystring');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


const initializePassport = require('../passport-config')
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

    const test = req.body
    if(test){
    console.log("+++++++++++++++++++++++++ //// " , test)
    }
    res.render('contact.ejs',{currentUser : req.user})
})
router.post('/contact', (req, res) =>{
    const test = req.body
    if(test){
    console.log("+++++++++++++++++++++++++ //// " , test)
    }
    res.render('home.ejs',{currentUser : req.user})
})

router.get('/account',checkAuthenticated, (req, res) =>{
    console.log("+++++++++++++>>>>",req.body);
    
    res.render('account.ejs',{currentUser : req.user})
})

router.get('/pricing', (req, res) =>{
    console.log("++++++++++++++ ",req.user)

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
    var reverse_query = querystring.parse(req.query.go)
    console.log("bro requ,,,,,,,,,:_>",reverse_query)
    res.render('checkout.ejs', { amount: reverse_query.pay});

});




// use query string to pass invoice and price value to checkout
router.get('/invoice',  checkAuthenticated, (req, res) => {
  var invoiceId= 'CBLL'+Math.floor(Math.random()*Math.pow(10,13));
  var pay = req.query.pay;
  // var query_now = querystring.encode('invoice_ID='+invoiceId+'&pay='+pay)
  var query_now = querystring.escape(querystring.stringify({'pay': pay,'invoice_ID': invoiceId}))
  // console.log("/////////////////////",querystring.escape(query_now))
  // console.log("///////////////////--->",decodeURI(query_now))

  res.redirect('/checkout?go='+ query_now)

});


// POST pay
router.post('/pay', checkAuthenticated, async (req, res) => {
    const { paymentMethodId, items, currency} = req.body;
    const test = await req.body;

    const amount = 2000;

    // const currency = 'usd'
    // const paymentMethodId = 'cbll_fee'
  
    try {
      // Create new PaymentIntent with a PaymentMethod ID from the client.
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        error_on_requires_action: true,
        confirm: true,
        description: 'Software development services',
        shipping: {
            name: 'Jenny Rosen',
            address: {
              line1: '510 Townsend St',
              postal_code: '98140',
              city: 'San Francisco',
              state: 'CA',
              country: 'US',
            },
          },
       });
     
      console.log("💰 Payment received!");


      req.user.isPaid = true;
    //   await req.user.save();
      // The payment is complete and the money has been moved
      // You can add any post-payment code here (e.g. shipping, fulfillment, etc)
  
      // Send the client secret to the client to use in the demo
      res.send({ clientSecret: intent.client_secret });
    } catch (e) {
      // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
      // See https://stripe.com/docs/declines/codes for more
      if (e.code === "authentication_required") {
        res.send({
          error:
            "This card requires authentication in order to proceeded. Please use a different card."
        });
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