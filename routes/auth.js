var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
const mysql = require("mysql2");
const app = express();
const config = require("../config");
var con = mysql.createConnection(config);
var authRouter = express.Router();

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

function loggedInAsBuyer(req, res, next) {
  if (req.isAuthenticated() && req.user.type == 1) {
    next();
  } else {
    res.redirect("/login");
  }
}

function loggedInAsSeller(req, res, next) {
  if (req.isAuthenticated() && req.user.type == 2) {
    next();
  } else {
    res.redirect("/login");
  }
}

con.connect(function (err) {
  if (err) throw err;
  else console.log("connected");
});

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    console.log(username);
    console.log(password);
    con.query(
      "SELECT * FROM amz_user WHERE email  = ?",
      [username],
      function (err, result) {
        console.log(result);
        if (err) {
          return cb(err);
        }
        if (result.length == 0) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }
        if (result[0].password != [password])
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        return cb(null, result);
      }
    );
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    console.log(user);
    return cb(null, {
      id: user[0].email,
      type: user[0].user_type,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  console.log(user);
  process.nextTick(function () {
    return cb(null, user);
  });
});

authRouter.get("/", (req, res) => {
  res.render("index");
});

authRouter.get("/login", (req, res) => {
  res.render("login");
});

authRouter.get("/registration", (req, res) => {
  res.render("registration");
});

authRouter.post(
  "/login/password",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect("/");
  }
);

authRouter.get("/cart", loggedInAsBuyer, (req, res) => {
  var user = req.user;
  console.log("------------> cart");
  console.log(user);
  res.render("cart");
});

authRouter.get("/add-product", loggedInAsSeller, (req, res) => {
  res.render("addproduct");
});

authRouter.post("/add-product", (req, res) => {
  var product_id;
  var product_id_sql = "SELECT MAX(product_id) AS maximum_id FROM product ";
  con.query(product_id_sql, (err, result) => {
    if (err) res.send("there was an error while adding the product");
    else {
      product_id = result[0].maximum_id + 1;
      console.log(product_id);

      var sql = "CALL add_product(?,?,?,?,?,?,?,?,?,?,?)";
      con.query(
        sql,
        [
          product_id,
          req.body.product_name,
          req.user.id,
          req.body.Price,
          1,
          req.body.description,
          req.body.available_units,
          req.body.color,
          req.body.weight,
          1,
          req.body.image_url,
        ],
        (err, result) => {
          if (err) res.send(err);
          else {
            res.redirect("/");
          }
        }
      );
    }
  });
});

authRouter.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

authRouter.get("/add-contact", loggedIn, (req, res) => {
  res.render("contact");
});

authRouter.post("/signup-buyer", function (req, res, next) {
  var sql = "CALL register_buyer(?,?,?,?)";
  con.query(
    sql,
    [req.body.email, req.body.fname, req.body.lname, req.body.password],
    function (err, result) {
      if (err)
        return "There was an error, try using a different username/email";
      console.log(result);
    }
  );
  res.render("login");
});

authRouter.post("/signup-seller", function (req, res, next) {
  var sql = "CALL register_seller(?,?,?,?,?,?,?)";
  con.query(
    sql,
    [
      req.body.email,
      req.body.fname,
      req.body.lname,
      req.body.password,
      req.body.company_name,
      "",
      "",
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return "There was an error, try using a different username/email";
      }
      console.log(result);
    }
  );
  res.render("login");
});

authRouter.post("/add-to-cart", loggedInAsBuyer, (req, res) => {
  console.log(req);
  var sql = `INSERT INTO product_shoppingcart VALUES(${req.body.product_id}, '${req.user.id}' )`;
  con.query(sql, (err, result) => {
    if (err) console.log(err);
  });
});

authRouter.get("/get-cart-items", loggedInAsBuyer, (req, res) => {
  var email = req.user.id;
  var sql = "SELECT * FROM product_shoppingcart WHERE buyer_id = ?";
  con.query(sql, [email], (err, result) => {
    // console.log(result)
    if (err) console.log(err);
    else res.send(result);
  });
});

module.exports = { authRouter, loggedIn, loggedInAsBuyer, loggedInAsSeller };
