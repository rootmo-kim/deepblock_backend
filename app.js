// modules
var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var multer = require("multer");
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

models.sequelize.sync().then( () => {
  console.log(" DB 연결 성공");
}).catch(err => {
  console.log("연결 실패");
  console.log(err);
});
// Import the sequelize models
// var db_models = require('./models').sequelize;
// db_models.sync();


app.get('/', function (req, res, next) {
  res.status(200).send('Hello world!');
  //res.status(404);
});


//multer example
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploadTest/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, "0.png"); // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
});
var upload = multer({storage : storage});

//userControllers
app.post('/register' ,userController.register);
app.post('/login' ,userController.login);
app.post('/logout', authMiddleware,userController.logout);
app.post('/unregister' ,authMiddleware , userController.unregister);

//projectControllers
app.get('/users/:id/projects', authMiddleware, projectController.viewProject);
app.post('/users/:id/projects', authMiddleware, projectController.createProject);
app.delete('/users/:id/projects', authMiddleware, projectController.deleteProject);

//load project
app.get('/users/:id/projects/:name', authMiddleware, projectController.loadProject);

//dataControllers
app.get('/users/:id/data', authMiddleware, dataController.viewData);
app.post('/users/:id/data', upload.single('image'),authMiddleware, dataController.uploadData); // multer example
app.delete('/users/:id/data', authMiddleware, dataController.deleteData);

//jsonController - updateJSON per 5sec
app.put('/board', authMiddleware, jsonController.updateJSON);

//modelControllers
app.post('/board/train', authMiddleware, modelMiddleware, modelController.trainModel);
app.post('/board/test', authMiddleware, modelMiddleware, modelController.testModel);

app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



