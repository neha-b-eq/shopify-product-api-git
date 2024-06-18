const express = require("express");
const app = express();
require('dotenv').config();
var bodyParser = require('body-parser');
const Controller = require("./Controller/controller")

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/productData',Controller.productData);

app.get('/testData',Controller.testData);
app.listen(process.env.PORT,function(){console.log(`App Running on ${process.env.PORT}`)})