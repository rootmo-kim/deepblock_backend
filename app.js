var express = require('express');
var bodyParser = require('body-parser');
// Init Express
var app = express();

// Set up body-parser with JSON
app.use(bodyParser.json());

app.get('/', function (req, res, next) {
    //res.status(200).send('Hello world!');
    res.status(404);
  });

  app.listen(process.env.PORT || 8000, function () {
    console.log('listening on port 8000');
  });


