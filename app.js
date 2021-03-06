"use strict"

// modules
let cors = require('cors');
let redis = require('redis');
let session = require('express-session');
let redis_store = require('connect-redis')(session);
let express = require('express');
let bodyParser = require('body-parser');
let sequelize = require('./models').sequelize;
let multer = require("multer");

// controllers
let userController = require('./controllers/userController');
let projectController = require('./controllers/projectController');
let modelController = require('./controllers/modelController');
let datasetController = require('./controllers/datasetController');
let classController = require('./controllers/classController');
let imageController = require('./controllers/imageController');

// middlewares
let authenticator = require('./middlewares/authenticator');
let sanitizer = require('./middlewares/sanitizer');
let avatarNavigator = require('./middlewares/avatarNavigator');
let imageNavigator = require('./middlewares/imageNavigator');

//utils
const responseHandler = require('./utils/responseHandler');

// Init Express
let app = express();

// Redis session
let redis_client = redis.createClient(6379, 'localhost');

// Cours setting
app.use(cors({
  origin: true,
  credentials: true
}))

// Init session
const sess = {
  key: 'sid',
  resave: false,
  secret: 'secret',
  saveUninitialized: true,
  store: new redis_store({
    client: redis_client
  }),
  cookie: {
    httpOnly: true,
    maxAge: 24000 * 60 * 60
  }
};
app.use(session(sess));

// Set up body-parser with JSON
app.use(bodyParser.json());

// Init DB squelizer
sequelize.sync().then(() => {
  console.log(" DB 연결 성공")
});


// Init multer
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path = `${req.original_path}/`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    let filename = `${new Date().valueOf()}_${file.originalname}`;
    cb(null, filename);
  }
})

// Init multer (userprofile)
let profile_storage = multer.diskStorage({
  destination : (req, file, cb) => {
    let path = req.user_path;  
    cb(null, path);
  },
  filename : (req, file, cb) => {
    let filename = `${new Date().valueOf()}_` + req.profile_name;
    let mimetype;

    switch(file.img_type){
      case "image/jpeg":
        mimetype = ".jpg";
      break;
      case "image/png":
        mimetype = ".png";
      break;
      case "image/gif":
        mimetype = ".gif";
      break;
      case "image/bmp":
        mimetype = ".bmp";
      break;
      default:
        mimetype = ".jpg";
      break;
    }
    cb(null, filename + mimetype);
  }
})
const avatar_upload = multer({
  storage : profile_storage
})

const imageUpload = multer({
  storage: storage
});

/*
  Request API
*/
app.get('/', function (req, res, next) {
  res.status(200).send('DeepBlock : GUI based deep learning service');
});
//userControllers
app.post('/register', sanitizer.register, userController.register);
app.post('/login', sanitizer.login, userController.login);
app.delete('/logout', authenticator, userController.logout);
app.delete('/u/unregister', authenticator, sanitizer.unregister, userController.unregister);
app.post('/findid', sanitizer.findID, userController.findID);
app.put('/findpasswd', sanitizer.findPassword, userController.findPassword);
app.get('/u', authenticator, userController.viewProfile);
app.get('/u/avatar', authenticator, userController.viewProfileImage);
app.put('/u/avatar', authenticator, avatarNavigator, avatar_upload.single('avatar'), userController.changeAvatar);
app.delete('/u/deleteavatar', authenticator, userController.deleteAvater);
app.post('/u/checkpasswd', authenticator, sanitizer.checkPassword, userController.checkPassword);
app.put('/u/passwd', authenticator, sanitizer.changePassword, userController.changePassword);
app.get('/verifyemail', sanitizer.verifyEmail, userController.verifyEmail);

// //projectControllers
app.get('/u/projects', authenticator, projectController.viewProjectList);
app.post('/u/projects', authenticator, sanitizer.createProject, projectController.createProject);
app.delete('/u/projects/:project_id', authenticator, sanitizer.deleteProject, projectController.deleteProject);
app.put('/u/projects/:project_id', authenticator, sanitizer.updateProjectName, projectController.updateProjectName);

//modelControllers
app.get('/u/projects/:project_id/model', authenticator, sanitizer.loadModelOfProject, modelController.loadModelOfProject);
app.put('/u/projects/:project_id/model', authenticator, sanitizer.updateModel, modelController.updateModel);
//modelControllers - model train/test
app.get('/u/projects/:project_id/model/train', authenticator, sanitizer.trainResult, modelController.trainResult);
app.get('/u/projects/:project_id/model/test', authenticator, sanitizer.testResult, modelController.testResult);
app.post('/u/projects/:project_id/model/train', authenticator, sanitizer.trainModel, modelController.trainModel);
app.post('/u/projects/:project_id/model/test', authenticator, sanitizer.testModel, modelController.testModel);

//dataControllers
app.get('/u/dataset', authenticator, datasetController.viewDatasetList);
app.post('/u/dataset', authenticator, sanitizer.createDataset, datasetController.createDataset);
app.delete('/u/dataset/:dataset_id', authenticator, sanitizer.deleteDataset, datasetController.deleteDataset);
app.put('/u/dataset/:dataset_id', authenticator, sanitizer.updateDatasetName, datasetController.updateDatasetName);

//classController
app.get('/u/dataset/:dataset_id/class', authenticator, sanitizer.loadClassOfDataset, classController.loadClassOfDataset);
app.post('/u/dataset/:dataset_id/class', authenticator, sanitizer.createCalss, classController.createClass);
app.delete('/u/dataset/:dataset_id/class/:class_id', authenticator, sanitizer.deleteClass, classController.deleteClass);
app.put('/u/dataset/:dataset_id/class/:class_id', authenticator, sanitizer.updateClassName, classController.updateClassName);

app.get('/u/dataset/:dataset_id/class/:class_id', authenticator, sanitizer.sendClassImage, imageController.sendClassImage);
app.post('/u/dataset/:dataset_id/class/:class_id/image', authenticator, sanitizer.uploadImage, imageNavigator, imageUpload.any(), imageController.uploadImage);
app.delete('/u/dataset/:dataset_id/class/:class_id/image/:image_id', authenticator, sanitizer.deleteImage, imageController.deleteImage);

app.get('/u/dataset/:dataset_id/class/:class_id/image/:image_id', authenticator, sanitizer.sendOriginalImage, imageController.sendOrigianlImage);

/*
    404 not found error handler
*/
app.use(function (req, res, next) {
  responseHandler.fail(res, 404, '404 Not found TT');
});

// Listen
app.listen(process.env.PORT || 8000, function (req, res) {
  console.log('listening on port 8000');
});



