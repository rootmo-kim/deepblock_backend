let fs      = require('fs');
let tf      = require("@tensorflow/tfjs-node");
let path    = require("path");

let data_loader   = require("./imageLoader");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const project_dir_name = require('../config/configs').projects;
const data_dir_name = require('../config/configs').datasets;
const res_handler = require('./responeHandler');

//삭제 예정 //TODO : DB에서 json 경로 질의
let proj    = require("../public/json/model_info.json");


module.exports = {
    loadModelOfProject(req, res){
        console.log('loadProject');
    },

    // Run 5 per second when user see board-page
    updateModel(req, res){
        
    },

    async trainModel(req, res){
        let history;
        let model;
        let data_path = `${base_path}/public/mnist/trainingSet/trainingSet`;
        
        if(proj.data.type == "img"){
            //train image load
            //TODO : DB에서 데이터 경로 질의
            let img_format = proj.data.info.format;
            let img_shape = proj.data.info.shape;

            let imgPath = await data_loader.dataInit(data_path, img_format, img_shape);
            const xs = await tf.data.generator(data_loader.imageGenerator);
            const ys = await tf.data.generator(data_loader.labelGenerator);
            const ds = await tf.data.zip({xs,ys}).shuffle(imgPath.length).batch(64);

            //model compile
            model = await getModelFromJson();

            if(model==false){
                console.log(`model compile failed`);
                return false;
            }

            //model train param
            let epoch = proj.models[0].fit.epochs;
            let batchs = proj.models[0].fit.batch_size;
            let val_per = proj.models[0].fit.val_data_per;
            history = await model.fitDataset(ds, {
                epochs:3,
                callbacks : {
                    //onEpochEnd = epoch 종료시 프린트
                    //onBatchEnd = batch 종료시 프린트
                    onEpochEnd: async (batch, logs) => {
                    console.log(batch + ' : ' + logs.acc);
                }}
            });
        }else if(proj.data.type == "csv"){
            //TODO : csv데이터 구현예정
        }else{
            return res.status(403).json({
                massage : "지원하지않는 데이터"
            });
        }

        //history 출력가능
        console.log(history);

        //trained model save
        let modelSavePath = `${base_path}/public`; //TODO : DB에서 사용자 프로젝트경로 질의
        if (modelSavePath != null) {
            await model.save(`file://${modelSavePath}`);
            console.log(`Saved model to path: ${modelSavePath}`);
            res.status(200);
        }
        
        //JSON to model
        async function getModelFromJson(){
            let model = tf.sequential();

            for (var _model of proj.models){
                try {
                    for(var _layer of _model.layers){
                        model.add( tf.layers[_layer.type](_layer.params) );
                    }
                    model.compile({
                        optimizer : _model.compile.optimizer,
                        loss      : _model.compile.loss,
                        metrics   : ['accuracy'],
                    });
                    model.summary()
                } catch (e) {
                    console.log(`${e}\r\nModel ID: ${_model.ID} LayerID : ${_layer.ID}`);
                    return false;
                }
            }
            return model;
        }
    },

    async testModel(req, res){
        //test model load
        let modelPrime;
        let saved_model_path = `${base_path}/public`; //TODO : DB에서 데이터 경로 질의
        try {
            modelPrime = await tf.loadLayersModel(`file://${saved_model_path}/model.json`);
            modelPrime.compile({
                optimizer : proj.models[0].compile.optimizer,
                loss : proj.models[0].compile.loss,
                metrics   : ['accuracy']
            });
            modelPrime.summary();
        }
        catch(e){
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
        const ds = await tf.data.zip({xs,ys}).shuffle(imgPath.length).batch(64);

        //model evaluation
        let result = await modelPrime.evaluateDataset(ds);

        //print evaluation result
        console.log(`result(loss) : ${result[0]}`);
        console.log(`result(acc) : ${result[1]}`);
    }
};

