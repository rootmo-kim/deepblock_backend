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
let datasetController = require('./controllers/datasetController');
let classController = require('./controllers/classController');
let imageController = require('./controllers/imageController');

// middlewares
let verification = require('./middlewares/verifier');
let authMiddleware = require('./middlewares/authenticator');
let sanitizer = require('./middlewares/sanitizer');

let base_path = require('./config/configs').base_path;
const project_dir_name = require('./config/configs').projects;
const data_dir_name = require('./config/configs').datasets;
const res_handler = require('./utils/responeHandler');

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
});

//userControllers
app.post('/register', sanitizer, userController.register);
app.post('/login' , sanitizer, userController.login);
app.post('/logout', authMiddleware, userController.logout);
app.post('/unregister', authMiddleware, sanitizer, userController.unregister);
app.post('/findid', sanitizer, userController.findID);
app.put('/findpasswd', sanitizer, userController.findPassword);
app.put('/:id/passwd', authMiddleware, sanitizer, userController.changePassword);
app.patch('/verifyemail', sanitizer, verification.verifyEmail);
app.patch('/verifypasswd', sanitizer, verification.verifyPassword);

//projectControllers
app.get('/:id/projects', authMiddleware, sanitizer, projectController.viewProjectList);
app.post('/:id/projects', authMiddleware, sanitizer, projectController.createProject);
app.delete('/:id/projects/:project_id', authMiddleware, sanitizer, projectController.deleteProject);
app.put('/:id/projects/:project_id', authMiddleware, sanitizer, projectController.updateProjectName);

//modelControllers
app.get('/:id/projects/:project_id', authMiddleware, sanitizer, modelController.loadModelOfProject);
app.put('/:id/projects/:project_id', authMiddleware, sanitizer, modelController.updateModel);
//modelControllers - model train/test
app.post('/:id/projects/:project_id/train', authMiddleware, sanitizer, modelController.trainModel);
app.post('/:id/projects/:/project_id/test', authMiddleware, sanitizer, modelController.testModel);

//dataControllers
app.get('/:id/dataset', authMiddleware, sanitizer, datasetController.viewDatasetList);
app.post('/:id/dataset', authMiddleware, sanitizer, datasetController.createDataset);
app.delete('/:id/dataset/:dataset_id', authMiddleware, sanitizer, datasetController.deleteDataset);
app.put('/:id/dataset/:dataset_id', authMiddleware, sanitizer, datasetController.updateDatasetName);

//classController
app.get('/:id/dataset/:dataset_id/class', authMiddleware, sanitizer, classController.loadClassOfDataset);
app.post('/:id/dataset/:dataset_id/class', authMiddleware, sanitizer, classController.createClass);
app.delete('/:id/dataset/:dataset_id/class/:class_id', authMiddleware, sanitizer, classController.deleteClass);
app.put('/:id/dataset/:dataset_id/class/:class_id', authMiddleware, sanitizer, classController.updateClassName);

app.get('/:id/dataset/:dataset_id/class/:class_id', authMiddleware, sanitizer, imageController.sendClassImage);
app.post('/:id/dataset/:dataset_id/class/:class_id/image', authMiddleware, sanitizer, upload.any(), imageController.uploadImage);
app.delete('/:id/dataset/:dataset_id/class/:class_id/image', authMiddleware, sanitizer, imageController.deleteImage);


// Listen
app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



