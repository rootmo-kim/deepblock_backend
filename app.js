var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');

var userController = require('./controllers/userManager');
var projectController = require('./controllers/projectManager');
var modelController = require('./controllers/modelManager');
var dataController = require('./controllers/dataManager');
var jsonController = require('./controllers/JSONManager');

var modelMiddleware = require('./middlewares/model');

// Init Express
var app = express();

// Set up body-parser with JSON
app.use(bodyParser.json());

// Import the sequelize models
var db_models = require('./models').sequelize;
db_models.sync();

app.get('/', function (req, res, next) {
  res.status(200).send('Hello world!');
  //res.status(404);
});

//userControllers
app.post('/register', userController.register);
app.post('/login', userController.login);
app.post('/logout', userController.logout);

//projectControllers
app.get('/myPage/project', middleware, projectController.viewProject);
app.post('/myPage/project', middleware ,projectController.createProject);
app.delete('/myPage/project', middleware, projectController.deleteProject);

//dataControllers
app.get('/mypage/data', middleware , dataController.viewData);
app.post('/myPage/data', middleware, dataController.viewData);
app.delete('/myPage/data', middleware, dataController.deleteData);

//modelControllers
app.post('/myPage/project/board/train', modelMiddleware, modelController.trainModel);
app.post('/myPage/project/board/test', modelMiddleware, modelController.trainModel);

//updateJSON
app.put('/myPage/project/board', middleware, jsonController.updateJSON);

app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



