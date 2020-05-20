'use strict';

const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
const rimraf = require('rimraf');
const tf = require("@tensorflow/tfjs-node");
const PImage = require('pureimage');
const pixels = require('image-pixels');
const getPixels = require('get-pixels');

let data_loader = require("../utils/imageLoader");
const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const project_dir_name = require('../config/configs').projects;
const data_dir_name = require('../config/configs').datasets;
const json_name = require('../config/configs').deep_model_json;
const responseHandler = require('../utils/responseHandler');

//삭제 예정 //TODO : DB에서 json 경로 질의
let proj = require("../public/json/model_info.json");


module.exports = {
  loadModelOfProject(req, res) {
    models.User.findOne({
      include: [{
        model: models.Project,
        where: {
          id: req.params.project_id
        }
      }],
      where: {
        id: req.session.userID
      }
    })
    .then((user_project) => {
      if (!user_project) {
        responseHandler.fail(res, 400, "잘못 된 접근입니다")
      } else {
        const project_path = user_project.dataValues.Projects[0].projectPath;
        const json_path = `${project_path}/${json_name}`;
        const proj_json = JSON.parse(fs.readFileSync(json_path).toString());
        responseHandler.custom(res, 200, proj_json);
      }
    })
    .catch(() => {
      responseHandler.fail(res, 500, "처리 실패");
    })
  },

  // Run 5 per second when user see board-page
  updateModel(req, res) {
    models.User.findOne({
      include: [{
        model: models.Project,
        where: {
          id: req.params.project_id
        }
      }],
      where: {
        id: req.session.userID
      }
    })
    .then((user_project) => {
      if (!user_project) {
        responseHandler.fail(res, 400, "잘못 된 접근입니다")
      } else {
        const project_path = user_project.dataValues.Projects[0].projectPath;
        const json_path = `${project_path}/${json_name}`;
        const model_json = JSON.stringify(req.body);
        fs.open(json_path, 'w', (function (err, file_id) {
          if (err) throw err;
          fs.writeSync(file_id, model_json, 0, model_json.length, null);
          fs.closeSync(file_id);
        }));
        responseHandler.success(res, 200, "저장 성공");
      }
    })
    .catch((err) => {
      responseHandler.fail(res, 500, "처리 실패");
    })
  },

  trainResult(req, res) {

  },

  testResult(req, res) {

  },

  async trainModel(req, res) {
    let model = null;
    try {
      let class_list = await models.Class.findAll({
        include: [{
          model: models.Image,
        }],
        where: {
          datasetID: req.body.dataset_id
        }
      });

      let labels = [];
      let x_list = [];
      let y_list = [];
      let classes_image_cnt = [];
      let class_num = class_list.length;
      let one_hot = 0;

      for (let _class of class_list) {
        _class = _class.dataValues

        let images = _class.Images;
        labels.push(_class.className);
        classes_image_cnt.push(images.length);

        for (let image of images) {
          let image_data = fs.readFileSync(image.originalPath);
          let result = tf.node.decodeImage(image_data);
          x_list.push(result);
          y_list.push(tf.oneHot(one_hot, class_num))
        }
        one_hot++;
      }

      let x_train = tf.stack(x_list);
      let y_train = tf.stack(y_list);

      let project_info = await models.Project.findOne({
        where: {
          userID: req.session.userID,
          id: req.params.project_id
        }
      })

      const project_path = project_info.dataValues.projectPath;
      const json_path = `${project_path}/${json_name}`;
      const project_json = JSON.parse(fs.readFileSync(json_path).toString());

      model = await getModelFromJson(project_json);

      if (!model) {
        responseHandler.fail(res, 400, '잘못 된 모델');
      } else {
        //model train param
        let epoch = 10;//proj_json.models[0].fit.epochs;
        let batchs = project_json.models[0].fit.batch_size;
        let val_per = project_json.models[0].fit.val_data_per; //실제 서비스에선 사용예정

        trainModel(model, x_train, y_train, epoch, batchs, ((history_list) => {
          console.log(history_list);

          let modelSavePath = `${project_path}`; //TODO : DB에서 사용자 프로젝트경로 질의
          if (modelSavePath != null) {
            model.save(`file://${modelSavePath}`);
          }
        }));

        // for(let e=0; e<epoch; e++){
        //     let history = await model.fit(x_train, y_train, {
        //         epochs: 1,
        //         batchSize: batchs,
        //         shuffle : true,
        //         callbacks : {
        //             //onEpochEnd = epoch 종료시 프린트
        //             //onBatchEnd = batch 종료시 프린트
        //             onEpochEnd: async (batch, logs) => {
        //                 console.log(batch + ' : ' + logs.acc);
        //                 console.log();
        //             }
        //         }
        //     })
        //     console.log(`======epoch:${e}======`);
        //     console.log(history.history);
        // }


        responseHandler.success(res, 200, "모델 학습 시작");
      }
    } catch (err) {
      console.log(err);
      responseHandler.fail(res, 500, "처리 실패");
    }

    //JSON to model
    async function getModelFromJson(proj) {
      let model = tf.sequential();

      for (var _model of proj.models) {
        try {
          for (var _layer of _model.layers) {
            model.add(tf.layers[_layer.type](_layer.params));
          }
          model.compile({
            optimizer: _model.compile.optimizer,
            loss: _model.compile.loss,
            metrics: ['accuracy'],
          });
          model.summary()
        } catch (e) {
          console.log(`${e}\r\nModel ID: ${_model.ID} LayerID : ${_layer.ID}`);
          return false;
        }
      }
      return model;
    }

    async function trainModel(model, x_train, y_train, epoch, batchs, callback) {
      let history_list = [];
      for (let e = 0; e < epoch; e++) {
        let history = await model.fit(x_train, y_train, {
          epochs: 1,
          batchSize: batchs,
          shuffle: true,
          //validationSplit : 0.2,
          callbacks: {
            //onEpochEnd = epoch 종료시 프린트
            //onBatchEnd = batch 종료시 프린트
            onEpochEnd: async (epoch, logs) => {
              console.log(epoch + ' : ' + logs.acc);
              console.log();
              //TODO : front로 보내줄 학습 중간결과 저장루틴 추가
            }
          }
        })
        history_list.push(history.history);

        //
      }

      callback(history_list);
    }
  },

  async testModel(req, res) {
    //test model load
    let modelPrime;
    let saved_model_path = `${base_path}/public`; //TODO : DB에서 데이터 경로 질의
    try {
      modelPrime = await tf.loadLayersModel(`file://${saved_model_path}/model.json`);
      modelPrime.compile({
        optimizer: proj.models[0].compile.optimizer,
        loss: proj.models[0].compile.loss,
        metrics: ['accuracy']
      });
      modelPrime.summary();
    }
    catch (e) {
      console.log(`Can't load model`);
      return false;
    }


    //test image load
    let path = `${base_path}/public/mnist/trainingSet/trainingSet`; //TODO : DB에서 데이터 경로 질의
    let img_format = proj.data.info.format;
    let img_shape = proj.data.info.shape;
    let imgPath = await data_loader.dataInit(path, img_format, img_shape);
    const xs = await tf.data.generator(data_loader.imageGenerator);
    const ys = await tf.data.generator(data_loader.labelGenerator);
    const ds = await tf.data.zip({ xs, ys }).shuffle(imgPath.length).batch(64);

    //model evaluation
    let result = await modelPrime.evaluateDataset(ds);

    //print evaluation result
    console.log(`result(loss) : ${result[0]}`);
    console.log(`result(acc) : ${result[1]}`);
  }
};

