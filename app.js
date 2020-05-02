// modules
require('dotenv').config();
let express = require('express');
let bodyParser = require('body-parser');
let sequelize = require('./models').sequelize;
let session = require('express-session');
let multer = require("multer");
let path = require('path');
let {check, validationResult} = require('express-validator');

// controllers
let userController = require('./controllers/userController');
let projectController = require('./controllers/projectController');
let modelController = require('./controllers/modelController');
let dataController = require('./controllers/dataController');
let classController = require('./controllers/classController');
let imageController = require ('./controllers/imageController');

// middlewares
let authMiddleware = require('./middlewares/author');
let directoryMiddleware = require('./middlewares/directory').diretoryMiddleware;
let sanitizer = require('./middlewares/sanitizer');

let base_path = require('./config/configs').base_path;
const project_dir_name = require('./config/configs').projects;
const data_dir_name = require('./config/configs').datasets;

// Init Express
var app = express();

// Init Session
app.use(session({
  key: 'sid',
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24000 * 60 * 60
  }
}));

// Set up body-parser with JSON
app.use(bodyParser.json());

// Init DB squelizer
sequelize.sync().then(() => {
  console.log(" DB 연결 성공")
});

// Init multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path = `${base_path}/${req.query.id}/${req.query.name}/${file.fieldname}/`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    //TODO : 파일명 hash해서 앞에 ?? 글자만 저장, mime type 추가
    let filename = `${req.files.length-1}.${file.originalname.split('.').pop()}`;
    cb(null, filename); 
  }
});
var upload = multer({storage : storage});

/*
  Request API
*/
app.get('/', function (req, res, next) {
  res.status(200).send('Hello world!');
  //res.status(404);
});

//userControllers
app.post('/register', sanitizer, userController.register);
app.post('/login' , sanitizer, userController.login);
app.post('/logout', authMiddleware,userController.logout);
app.post('/unregister', authMiddleware, sanitizer, userController.unregister);

//projectControllers
app.get('/:id/projects', authMiddleware, sanitizer, projectController.viewProject);
app.post('/:id/projects', authMiddleware, sanitizer, projectController.createProject);
app.delete('/:id/projects/:project-id', authMiddleware, sanitizer, projectController.deleteProject);
app.put('/:id/projects/:project-id', authMiddleware, sanitizer, projectController.updateProject);

//load project
app.get('/:id/projects/:project-id', authMiddleware, sanitizer, projectController.loadProject);

//modelControllers
app.put('/:id/projects/:project-id', authMiddleware, sanitizer, modelController.updateModel);
app.post('/:id/projects/:project-id/train', authMiddleware, sanitizer, modelController.trainModel);
app.post('/:id/projects/:/project-id/test', authMiddleware, sanitizer, modelController.testModel);

//dataControllers
app.get('/:id/dataset', authMiddleware, sanitizer, dataController.viewDataset);
app.post('/:id/dataset', authMiddleware, sanitizer, dataController.createDataset);
app.delete('/:id/dataset/:dataset-id', authMiddleware, sanitizer, dataController.deleteDataset);
app.put('/:id/dataset/:dataset-id', authMiddleware, sanitizer, dataController.updateDataset);

//load dataset
app.get('/:id/dataset/:dataset-id', authMiddleware, sanitizer, dataController.loadDataset);

//classController
app.get('/:id/dataset/:dataset-id', authMiddleware, sanitizer, classController.viewClass);
app.post('/:id/dataset/:dataset-id', authMiddleware, sanitizer, classController.createClass);
app.delete('/:id/dataset/:dataset-id/class', authMiddleware, sanitizer, classController.deleteClass);
app.put('/:id/dataset/:dataset-id/class', authMiddleware, sanitizer, classController.updateClass);

//imageController
app.post('/:id/dataset/:dataset-id/class/:class-id', authMiddleware, sanitizer, upload.any(), imageController.uploadImage);
app.delete('/:id/dataset/:dataset-id/class/:class-id', authMiddleware, sanitizer, imageController.deleteImage);


// Listen
app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



