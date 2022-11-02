const express = require('express');
const app = express();
const {authRouter, loggedIn} = require('./routes/auth')
const dbRouter = require('./routes/db')
const path = require("path");
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname+'/views'))
app.use(express.json())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false ,
                maxAge:1000000000}
  }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRouter);
app.use('/', dbRouter);












const PORT = 4000;
app.listen(PORT, ()=>{
    console.log(`listening at http://localhost:${PORT}`)
})