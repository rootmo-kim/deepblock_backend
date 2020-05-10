// modules
let redis = require('redis');
let session = require('express-session');
let redis_store = require('connect-redis')(session);
let express = require('express');
let bodyParser = require('body-parser');
let sequelize = require('./models').sequelize;
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
let authenticator = require('./middlewares/authenticator');
let sanitizer = require('./middlewares/sanitizer');

const base_path = require('./config/configs').base_path;
const project_dir_name = require('./config/configs').projects;
const data_dir_name = require('./config/configs').datasets;
const res_handler = require('./utils/responseHandler');
const customStroage = require('./utils/customStorage');

// Init Express
var app = express();

// redis 세션관리
var redis_client = redis.createClient(6379, 'localhost');

const sess = {
    key: 'sid',
    resave: false,
    secret: 'secret',
    saveUninitialized: true,
    store: new redis_store({
        client: redis_client
    }),
    cookie: {
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
var custom_storage = customStroage({
  destination: function (req, file, cb) {
    //let path = `${base_path}/${req.query.id}/${req.query.name}/${file.fieldname}/`;
    let path = `${base_path}/attachments/`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    //let filename = `${req.files.length-1}.${file.originalname.split('.').pop()}`;
    let filename = `${new Date().valueOf()}_${file.originalname}`;
    cb(null, filename); 
  }
})

const upload = multer({
  storage : custom_storage
});

///////////////////////////////////multer test//////////////////////
app.post('/test/image/multer', upload.any(), ((req, res)=>{
  console.log(req.files);
}));
/////////////////////////////////////////////////////////////////////

/*
  Request API
*/
app.get('/', function (req, res, next) {
  res.status(200).send('DeepBlock : GUI based deep learning service');
});

//userControllers
app.post('/register', sanitizer, userController.register);
app.post('/login' , sanitizer, userController.login);
app.post('/logout', authenticator, userController.logout);//delete
app.post('/unregister', authenticator, sanitizer, userController.unregister);//delete
app.post('/findid', sanitizer, userController.findID);
app.put('/findpasswd', sanitizer, userController.findPassword);
app.put('/:id/passwd', authenticator, sanitizer, userController.changePassword);
app.get('/verifyemail', sanitizer, userController.verifyEmail);

//projectControllers
app.get('/:id/projects', authenticator, sanitizer, projectController.viewProjectList);
app.post('/:id/projects', authenticator, sanitizer, projectController.createProject);
app.delete('/:id/projects/:project_id', authenticator, sanitizer, projectController.deleteProject);
app.put('/:id/projects/:project_id', authenticator, sanitizer, projectController.updateProjectName);

//modelControllers
app.get('/:id/projects/:project_id', authenticator, sanitizer, modelController.loadModelOfProject);
app.put('/:id/projects/:project_id', authenticator, sanitizer, modelController.updateModel);
//modelControllers - model train/test
app.post('/:id/projects/:project_id/train', authenticator, sanitizer, modelController.trainModel);
app.post('/:id/projects/:/project_id/test', authenticator, sanitizer, modelController.testModel);

//dataControllers
app.get('/:id/dataset', authenticator, sanitizer, datasetController.viewDatasetList);
app.post('/:id/dataset', authenticator, sanitizer, datasetController.createDataset);
app.delete('/:id/dataset/:dataset_id', authenticator, sanitizer, datasetController.deleteDataset);
app.put('/:id/dataset/:dataset_id', authenticator, sanitizer, datasetController.updateDatasetName);

//classController
app.get('/:id/dataset/:dataset_id/class', authenticator, sanitizer, classController.loadClassOfDataset);
app.post('/:id/dataset/:dataset_id/class', authenticator, sanitizer, classController.createClass);
app.delete('/:id/dataset/:dataset_id/class/:class_id', authenticator, sanitizer, classController.deleteClass);
app.put('/:id/dataset/:dataset_id/class/:class_id', authenticator, sanitizer, classController.updateClassName);

app.get('/:id/dataset/:dataset_id/class/:class_id', authenticator, sanitizer, imageController.sendClassImage);
app.post('/:id/dataset/:dataset_id/class/:class_id/image', authenticator, sanitizer, upload.any(), imageController.uploadImage);
app.delete('/:id/dataset/:dataset_id/class/:class_id/image', authenticator, sanitizer, imageController.deleteImage);


// Listen
app.listen(process.env.PORT || 8000, function () {
  console.log('listening on port 8000');
});



