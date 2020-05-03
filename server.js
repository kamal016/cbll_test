if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express")
const app = express()

const methodOverride = require('method-override')
const routes = require('./routes/home')
const flash = require('express-flash')
const session = require('express-session')

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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


// app.get('/checkout', async (req, res) => {
//     try{
//         console.log("I am here in checkout")
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: 10,
//             currency: 'usd',
//             description: 'Software development services',
//             // Verify your integration in this guide by including this parameter
//             metadata: {integration_check: 'accept_a_payment'},
//         });

//         var customer = await stripe.customers.create({
//             name: 'Jenny Rosen',
//             address: {
//               line1: '510 Townsend St',
//               postal_code: '98140',
//               city: 'San Francisco',
//               state: 'CA',
//               country: 'US',
//             }
//           });

//         // const paymentIntent = await stripe.paymentIntents.create({
//         //     description: 'Software development services',
//         //     shipping: {
//         //       name: 'Jenny Rosen',
//         //       address: {
//         //         line1: '510 Townsend St',
//         //         postal_code: '98140',
//         //         city: 'San Francisco',
//         //         state: 'CA',
//         //         country: 'US',
//         //       },
//         //     },
//         //     amount: 1099,
//         //     currency: 'usd',
//         //     payment_method_types: ['card'],
//         //   })
//         res.render('checkout.ejs', { client_secret: paymentIntent.client_secret });
//     }catch(err){
//         console.log(err);
//         req.flash('error', err.message);
//         res.redirect('back');
//     }

    
//   });
  





app.use('/',routes);


//catch 404 and forward to
// app.use(function(req, res, next){
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });


app.listen(3000)