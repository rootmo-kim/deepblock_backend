// modules
var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');

// controllers
var userController = require('./controllers/userManager');
var projectController = require('./controllers/projectManager');
var modelController = require('./controllers/modelManager');
var dataController = require('./controllers/dataManager');
var jsonController = require('./controllers/jsonManager');

// middlewares
var authMiddleware = require('./middlewares/author');
var modelMiddleware = require('./middlewares/model');
var sanitizer = require('./middlewares/sanitizer');

// Init Express
var app = express();

// Set up body-parser with JSON
app.use(bodyParser.json());
app.use(sanitizer);

// Import the sequelize models
// var db_models = require('./models').sequelize;
// db_models.sync();



app.get('/', function (req, res, next) {
  res.status(200).send('Hello world!');
  //res.status(404);
});

//userControllers
app.post('/register' ,userController.register);
app.post('/login' ,userController.login);
app.post('/logout', authMiddleware,userController.logout);
app.post('/unregister' ,authMiddleware , userController.unregister);

//projectControllers
app.get('/users/:id/projects', authMiddleware, projectController.viewProject);
app.post('/projects', authMiddleware, projectController.createProject);
app.delete('/projects', authMiddleware, projectController.deleteProject);

//load project
app.get('/users/:id/projects/:name', authMiddleware, jsonController.sendJSON);

//dataControllers
app.get('/users/:id/data', authMiddleware, dataController.viewData);
app.post('/data', authMiddleware, dataController.uploadData);
app.delete('/data', authMiddleware, dataController.deleteData);

//jsonController - updateJSON per 5sec
app.put('/board', authMiddleware, jsonController.updateJSON);

//modelControllers
app.post('/board/train', authMiddleware, modelMiddleware, modelController.trainModel);
app.post('/board/test', authMiddleware, modelMiddleware, modelController.testModel);

app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



