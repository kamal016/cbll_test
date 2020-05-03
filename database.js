

const {Pool} = require('pg') 
// const pool  = new Pool({
//     user : 'citybylatlong',
//     host: 'cbllprod.cczrvm6mxs9e.us-west-2.rds.amazonaws.com',
//     database: 'postgres',
//     password:'kamalthakur016',
//     port:'5432',
//     max:20,
//     connectionTimeoutMillis:0,
//     idleTimeoutMillis:0
// });


const pool  = new Pool({
    user : 'postgres',
    host: 'localhost',
    database: 'cbll',
    password:'12uec016',
    port:'5432',
    max:20,
    connectionTimeoutMillis:0,
    idleTimeoutMillis:0
});


module.exports = {pool}
