const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const md5 = require('md5');
var mysql = require("mysql");
const jwt = require("jsonwebtoken");
const verify = require('./verifyToken')
const cors = require('cors')
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodeDb"
});
connection.connect(function(err){
//   if(err){
//     console.log('Error connecting to Db', err);
//     return;
//   }
//   console.log('Connection established');
if (err) throw err;
  console.log("Connected!");
  var sql = "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255))";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
  var sql = "CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price int, quantity int, total int)";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())

app.get('/', (req,res)=>{
    res.status(200).send({message:"server running...."})
})
app.post('/register',verify, async (req,res)=>{
    const userDetails = req.body;
    const password = md5(req.body.password)
    const queryCount = `SELECT COUNT(*) AS cnt FROM users WHERE email = '${userDetails.email}'`;
    await connection.query(queryCount, function (err, result) {
        if(err){
            console.log(err);
        }   
        else{
            if(result[0].cnt > 0){  
                  res.status(200).send({message: "user already exist"}) 
            }else{
                var sql = `INSERT INTO users (name,email,password) VALUES ('${userDetails.name}', '${userDetails.email}', '${password}')`;
                connection.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
                res.status(200).send({message: "user created"})
                });               
            }
        }
    }); 
});
app.post('/login', (req,res)=>{
    const userDetails = req.body;
    const query = `SELECT * FROM users WHERE email = '${userDetails.email}'`
    connection.query(query, function (err, result, fields) {
        if (err) throw err;
        if(result[0] == null){
            res.status(403).send({messgae:"no user found"})
        }else{
            if(md5(userDetails.password)==result[0].password){
                const token = jwt.sign(
                    { username: result[0].name, useremail: result[0].email, user_id: result[0]._id },
                    "thisTokenIsSecretForPalatio",
                    {
                      expiresIn: "10m",
                    }
                  );
                res.status(200).send({username: result[0].name, useremail: result[0].email, user_id: result[0].id, token})
            }else{
                res.status(400).send({message:"wrong password"})
            }
        }
      });
});

app.get('/items',verify, (req, res)=>{
    const itemAddQuery = `SELECT * FROM items`;
    connection.query(itemAddQuery, function (err, result) {
        if (err) throw err;
        console.log(result.insertId);
        res.status(200).send(result)
    });
})
app.post('/itemsAdd',verify, (req, res)=>{
    const itemDetails = req.body;
    const itemAddQuery = `INSERT INTO items (name,price,quantity, total) VALUES ('${itemDetails.name}', '${itemDetails.price}', '${itemDetails.quantity}','${itemDetails.quantity * itemDetails.price }')`
    connection.query(itemAddQuery, function (err, result) {
        if (err) throw err;
        console.log(result.insertId);
        res.status(200).send({id : result.insertId})
    });
})
app.put('/itemsUpdate',verify, (req, res)=>{
    const itemDetails = req.body;
    const itemUpdateQuery = `UPDATE items SET name='${itemDetails.name}', price='${itemDetails.price}', quantity='${itemDetails.quantity}', total='${itemDetails.quantity * itemDetails.price }' WHERE id='1'`;
    connection.query(itemUpdateQuery, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send({message:`Successfully updated ${result.affectedRows} rows`})
    });
})
app.delete('/itemsDelete',verify, (req, res)=>{
    const itemDeleteQuery =`DELETE FROM items WHERE id = '${req.body.id}'`
    connection.query(itemDeleteQuery, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send({message:`Successfully deleted ${result.affectedRows} rows`})
    });
})

app.get('/innerjoin',(req,res)=>{
    const innnerJoinQuery = "SELECT users.name AS username, users.email as userEmail, items.name AS productName, items.quantity AS quantity, items.total AS total FROM users INNER JOIN items ON users.id = items.id";
    connection.query(innnerJoinQuery, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send(result)
    });
})

app.get('/leftjoin', (req, res)=>{
    const leftjoin = "SELECT users.name AS username, users.email as userEmail, items.name AS productName, items.quantity AS quantity FROM users LEFT JOIN items USING(id) "
    connection.query(leftjoin, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send(result)
    });
})
app.get('/rightjoin', (req, res)=>{
    const rightjoin = "SELECT users.name AS username, users.email as userEmail, items.name AS productName, items.quantity AS quantity FROM users RIGHT JOIN items USING(id) "
    connection.query(rightjoin, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send(result)
    });
})
app.get('/crossjoin', (req, res)=>{
    const crossjoin = "SELECT users.name AS username, users.email as userEmail, items.name AS productName, items.quantity AS quantity, items.total AS total FROM users CROSS JOIN items"
    connection.query(crossjoin, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        res.status(200).send(result)
    });
})

const port = process.env.PORT || 3000
app.listen(port, function(){
    console.log('Listening on port ' + port); 
});