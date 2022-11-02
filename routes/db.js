const express = require("express");
const app = express();
const mysql = require("mysql2");
const config = require("../config");
const {
  authRouter,
  loggedIn,
  loggedInAsBuyer,
  loggedInAsSeller,
} = require("./auth");
var con = mysql.createConnection(config);
var router = express.Router();

router.get("/get-all-products", (req, res) => {
  con.query("SELECT * FROM product_image", (err, result) => {
    if (err) res.send(err);
    else res.send(result);
  });
});

router.post("/add-contact", loggedIn, (req, res) => {
  var email = req.user.id;
  var address_id = Math.floor(Math.random() * 1000 + 1);
  var sql = `INSERT INTO contact_detail (user_id, address_id, street1, street2, city, state, country, zipcode, phone) VALUES ('${email}',${address_id},?,?,?,?,?,?,?)`;
  con.query(
    sql,
    [
      req.body.Street1,
      req.body.Street2,
      req.body.City,
      req.body.State,
      req.body.Country,
      req.body.Zipcode,
      req.body.Phone,
    ],
    (err, result) => {
      if (err) res.send(err);
      else res.redirect("/");
    }
  );
});

router.post("/get-product-detail", (req, res) => {
  var product_id = req.body.product_id;
  var sql = "SELECT * FROM product WHERE product_id = ?";
  con.query(sql, [product_id], (err, result) => {
    console.log(result);
    if (err) res.send(err);
    else res.send(result);
  });
});

router.post("/clear-cart", (req, res) => {
  var email = req.user.id;
  var sql = "DELETE FROM product_shoppingcart WHERE buyer_id = ?";
  con.query(sql, [email], (err, result) => {
    if (err) res.send(err);
    else res.send(result);
  });
});

router.post("/order-now", loggedInAsBuyer, async (req, res) => {
  console.log("order now was called");
  var email = req.user.id;
  var orderId;
  var paymentId;
  var order_id_sql = "SELECT MAX(order_id) as order_id FROM amz_order";
  con.query(order_id_sql, (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      orderId = result[0].order_id + 1;
      console.log("======order id");
      console.log(orderId);

      var payment_id_sql =
        "SELECT MAX(payment_id) as payment_id FROM amz_order";
      con.query(payment_id_sql, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          paymentId = result[0].payment_id + 1;
          console.log("======payment id");
          console.log(paymentId);

          var total_price = req.body.totalPrice;
          let ts = Date.now();

          let date_ob = new Date(ts);
          let date = date_ob.getDate();
          let month = date_ob.getMonth() + 1;
          let year = date_ob.getFullYear();
          var date_of_order = year + "-" + month + "-" + date;
          var order_sql = "CALL order_now(?,?,?,?,?,?,?,?,?,?,?)";
          var delivery_address_id = req.body.delivery_address_id;
          con.query(
            order_sql,
            [
              orderId,
              email,
              paymentId,
              total_price,
              date_of_order,
              ,
              ,
              delivery_address_id,
              ,
              1,
              1,
            ],
            (err, result) => {
              if (err) {
                console.log(err);
                res.send(err);
              } else {
                console.log(result);
                res.send(result);
              }
            }
          );
        }
      });
    }
  });
});

module.exports = router;
