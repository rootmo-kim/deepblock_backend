// modules
var express = require('express');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var sequelize = require('./models').sequelize;
var session = require('express-session');
var multer = require("multer");
var {check, validationResult} = require('express-validator');

// controllers
var userController = require('./controllers/userManager');
var projectController = require('./controllers/projectManager');
var modelController = require('./controllers/modelManager');
var dataController = require('./controllers/dataManager');
var jsonController = require('./controllers/jsonManager');

// middlewares
var authMiddleware = require('./middlewares/author');
var dataMiddleware = require('./middlewares/data');
var modelMiddleware = require('./middlewares/model');
var sanitizer = require('./middlewares/sanitizer');
<<<<<<< HEAD
=======
var models = require("./models/index");
>>>>>>> origin/master

// Init Express
var app = express();

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
app.use(expressSanitizer());

sequelize.sync().then( () => {
  console.log(" DB 연결 성공");
}).catch(err => {
  console.log("연결 실패");
  console.log(err);
});

//multer example
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploadTest/'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
//     //cb(null, 'db/req.query.id/data/req.body.data_name/')
//   },
//   filename: function (req, file, cb) {
//     console.log(file);
//     cb(null, file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
//   }
// });
// var upload = multer({storage : storage});

const customStorage = require('./storage')

let dirname = 0
let storage = customStorage({
  destination: function (req, file, cb) {
    console.log(req)
    cb(null, `uploadTest/` + file.originalname)
  },
  // filename: (req, file, cb) => {
  //   console.log(file)
  //   cb(null, file.originalname)
  // }
  // basename: ()=>{return `${cnt}`}
});

let upload = multer({storage : storage});

/*
  Request API
*/
app.get('/', function (req, res, next) {
  res.status(200).send('Hello world!');
  //res.status(404);
});

//userControllers
app.post('/register', [
  check('user_id').trim().blacklist('\\').isLength({min : 6}),
  check('userEmail').isEmail(),
  check('password').trim().isLength({min : 6})
], sanitizer, userController.register);
app.post('/login' , [
  check('user_id').trim().blacklist('\\').isLength({min : 6}),
  check('password').trim().isLength({min : 6})
], sanitizer, userController.login);
app.post('/logout', authMiddleware,userController.logout);
app.post('/unregister', authMiddleware, [
  check('user_id').trim().blacklist('\\').isLength({min : 6})
], sanitizer, userController.unregister);

//projectControllers
app.get('/users/:id/projects', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
], sanitizer, projectController.viewProject);
app.post('/users/:id/projects', authMiddleware, [
  check('id').escape().trim().blacklist('\/[\/]'),
  check('project_name').trim().blacklist('\/[\/]').escape()
], sanitizer, projectController.createProject);
app.delete('/users/:id/projects', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
  check('project_name').trim().blacklist('\\')
], sanitizer, projectController.deleteProject);

//load project
app.get('/users/:id/projects/:name', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
  check('name').trim().blacklist('\\')
], sanitizer, projectController.loadProject);

//dataControllers
app.get('/users/:id/data', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6})
], sanitizer, dataController.viewData);

//dataUpload 
app.post('/users/:id/data', authMiddleware, [
  check('id').escape().trim().blacklist('\/[\/]'),
  check('data_name').trim().blacklist('\/[\/]')
], sanitizer, upload.array('image'), dataController.uploadData);

app.delete('/users/:id/data', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
//  check('data_name').trim().blacklist('\\')
], sanitizer, dataController.deleteData);

//jsonController - updateJSON per 5sec
app.put('/board', authMiddleware, jsonController.updateJSON);

//modelControllers
app.post('/board/train', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
  check('project_name').trim().blacklist('\\'),
  check('data_name').trim().blacklist('\\')
], sanitizer, modelMiddleware, modelController.trainModel);
app.post('/board/test', authMiddleware, [
  check('id').trim().blacklist('\\').isLength({min : 6}),
  check('project_name').trim().blacklist('\\'),
  check('data_name').trim().blacklist('\\')
], sanitizer, modelMiddleware, modelController.testModel);

app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8080');
});



