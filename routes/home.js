const bcrypt = require("bcrypt");
const passport = require('passport');
var express = require('express');
var router = express.Router();

const querystring = require('querystring');
const uuid = require('uuid');
const moment = require('moment');
const keygen = require("keygenerator");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Swal = require('sweetalert2')

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  onOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})


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
    var query_str = `INSERT INTO users (username, email,password,company, created_on) VALUES ('${username}', '${email}', '${hashedPassword}', '${company}', '${timestamp}')`
    pool.query(query_str).then(res => {
        console.log( res)
    }).catch(err => {
        res.redirect('/register')
        console.log(err.stack);
    }).finally(() => {            
        res.redirect('/login')
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



router.get('/contact', (req, res) =>{
    res.render('contact.ejs',{currentUser : req.user})
})
// router.post('/contact', (req, res) =>{

//   console.log("Yes i am here -->", req.body)
//   res.redirect('/')
// })


router.get('/account',checkAuthenticated, (req, res) =>{
  let queryStr = `SELECT * FROM details where id = ${req.user.id} order by start_timestamp desc limit 1`

  pool.query(queryStr).then(response => {
      if ((response.rows).length == 0)
      {
        let key = uuid.v4()
        let id = req.user.id
        let invoiceId = 'CBLL00XXXX'
        let paymentStatus = 'free'
        let amountPay = '0'
        let availableCalls = 10000
        let remainingCalls = 5000
        const startTimestamp = Date.now().toString()
        const endTimestamp = (parseInt(startTimestamp) +  2678400000).toString() 
        let billingDate =  moment().format('L')
        let expiringDate =  moment().add(1, "months").format('L')
        
        var data = {'key':key, 
                    'id': id, 
                    'invoiceId': invoiceId, 
                    'paymentStatus': paymentStatus,
                    'amountPay' : amountPay,
                    'availableCalls' : availableCalls,
                    'remainingCalls' : remainingCalls,
                    'startTimestamp' : startTimestamp,
                    'endTimestamp' : endTimestamp,
                    'billingDate' : billingDate,
                    'expiringDate' : expiringDate  
                  }

        let queryStr = `INSERT INTO details (id, api_key, invoice_id, payment_status, amount_paid, available_calls, remaining_calls, start_timestamp, end_timestamp, billing_date, expiring_date)
                       VALUES ('${id}', '${key}', '${invoiceId}', '${paymentStatus}', '${amountPay}', '${availableCalls}','${remainingCalls}','${startTimestamp}','${endTimestamp}','${billingDate}','${expiringDate}' )`
        pool.query(queryStr).then(response => {
          console.log( response)
          res.render('account.ejs',{currentUser : req.user,  data : data})
        }).catch(err => {
          console.log(err.stack);
        })
      }
      else{
        var row = response.rows[0]
        if (row){
          var data = {'key':row['api_key'], 
                      'id': row['id'], 
                      'invoiceId': row['invoice_id'], 
                      'paymentStatus': row['payment_status'],
                      'amountPay' : row['amount_paid'],
                      'availableCalls' : row['available_calls'],
                      'remainingCalls' : row['remaining_calls'],
                      'startTimestamp' : row['start_timestamp'],
                      'endTimestamp' : row['end_timestamp'],
                      'billingDate' : row['billing_date'],
                      'expiringDate' : row['expiring_date']
                    }    
          res.render('account.ejs',{currentUser : req.user,  data : data})
        }
      }
    }).catch(err => {
      console.log(err.stack);
      })
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
        return res.redirect('/account');
    }    
    let reverseQuery = querystring.parse(req.query.go)
    res.render('checkout.ejs', { amount: reverseQuery.pay, invoiceId: reverseQuery.invoiceId });

});

// use query string to pass invoice and price value to checkout
router.get('/invoice',  checkAuthenticated, (req, res) => {
  let invoiceId= 'CBLL'+Math.floor(Math.random()*Math.pow(10,7));
  let pay = req.query.pay;
  let query_now = querystring.escape(querystring.stringify({'pay': pay,'invoiceId': invoiceId}))
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

      let queryStr = `INSERT INTO details (id, api_key, invoice_id, payment_status, amount_paid, available_calls, remaining_calls, start_timestamp, end_timestamp, billing_date, expiring_date)
                       VALUES ('${id}', '${apiKey}', '${invoiceId}', '${paymentStatus}', '${amountPay}', '${availableCalls}','${remainingCalls}','${startTimestamp}','${endTimestamp}','${billingDate}','${expiringDate}' )`

      pool.query(queryStr).then(response => {
          console.log( response)
          console.log("toast toh hone ko mangta tha bc");
          
          // Toast.fire({
          //   icon: 'success',
          //   title: 'Signed in successfully'
          // })
          res.send({ clientSecret: intent.client_secret });
      }).catch(err => {
        console.log(err.stack);
        res.send({error: "Database connection failed. Please try again later."});
      })

    } catch (e) {
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

function generateKey(){
  let key = keygen._();
  return key
}

module.exports = router;