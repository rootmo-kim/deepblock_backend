// modules
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
let jsonController = require('./controllers/jsonController');

// middlewares
let authMiddleware = require('./middlewares/author');
let directoryMiddleware = require('./middlewares/directory').diretoryMiddleware;
let sanitizer = require('./middlewares/sanitizer');

let base_path = require('./config/config').base_path;
const project_dir_name = require('./config/config').projects;
const data_dir_name = require('./config/config').datasets;

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
sequelize.sync().then( () => {
  console.log(" DB 연결 성공");
}).catch(err => {
  console.log(err);
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
////////// for test ///////// 
app.post('/upload/:id/data/:name/test1', directoryMiddleware, dataController.addDataset);//upload.array('image'), dataController.uploadData);
app.post('/upload/:id/data/:name/test2', upload.any(), dataController.uploadImage);
/////////////////////////////

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
app.get('/users/:id/projects', authMiddleware, sanitizer, projectController.viewProject);
app.post('/users/:id/projects', authMiddleware, sanitizer, projectController.createProject);
app.delete('/users/:id/projects', authMiddleware, sanitizer, projectController.deleteProject);

//load project
app.get('/users/:id/projects/:name', authMiddleware, sanitizer, projectController.loadProject);

//dataControllers - dataset
app.get('/users/:id/dataset', authMiddleware, sanitizer, dataController.viewDataset);
app.post('/users/:id/dataset', authMiddleware, sanitizer, dataController.addDataset);
app.delete('/users/:id/dataset', authMiddleware, sanitizer, dataController.deleteDataset);

//dataControllers - data
app.post('/users/:id/dataset/:name', authMiddleware, sanitizer, upload.any(), dataController.uploadImage);
app.delete('/users/:id/dataset/:name', authMiddleware, sanitizer, dataController.deleteImage);

//jsonController - updateJSON per 5sec
app.put('/board', authMiddleware, jsonController.updateJSON);

//modelControllers
app.post('/board/train', authMiddleware, sanitizer, modelController.trainModel);
app.post('/board/test', authMiddleware, sanitizer, modelController.testModel);

app.get('/test/:id', ((req, res)=>{
  console.log(req.query.id);
  console.log(req.params.id);
}))

// Listen
app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



