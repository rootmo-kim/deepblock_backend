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
let dataMiddleware = require('./middlewares/data');
let modelMiddleware = require('./middlewares/model');
let directoryMiddleware = require('./middlewares/directory');
let sanitizer = require('./middlewares/sanitizer');


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
    let base_path = `C:/Users/JinSung/Desktop/deepblock_git/tfjs_practice/${req.query.id}/${req.query.name}/`;
    let final_path = path.normalize(`${base_path}${file.fieldname}/`);
    cb(null, final_path);
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
app.post('/upload/:id/data/:name/test1', directoryMiddleware.diretoryMiddleware, dataController.uploadData);//upload.array('image'), dataController.uploadData);
app.post('/upload/:id/data/:name/test2', upload.any(), dataController.uploadData);
/////////////////////////////

//userControllers 
app.post('/register',[
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
app.post('/users/:id/projects/:name', authMiddleware, [
  check('id').escape().trim().blacklist('\/[\/]'),
  check('project_name').trim().blacklist('\/[\/]').escape()
], sanitizer, projectController.createProject);
app.delete('/users/:id/projects/:name', authMiddleware, [
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
app.post('/users/:id/data/:name', authMiddleware, [
  check('id').escape().trim().blacklist('\/[\/]'),
  check('data_name').trim().blacklist('\/[\/]')
], sanitizer, upload.array('image'), dataController.uploadData);

app.delete('/users/:id/data/:name', authMiddleware, [
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

// Listen
app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



