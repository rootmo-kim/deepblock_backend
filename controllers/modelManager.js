let fs      = require('fs');
let tf      = require("@tensorflow/tfjs-node");
let datas   = require("../models/data");
let proj    = require("../public/json/model_info.json");


module.exports = {
    async trainModel(req, res){
        //컴파일된 모델을 업로드된 데이터를 사용하여 학습함

        //유저가 선택한 데이터가 무엇인지 req에서 가져와 /user/req.body.dataset_name 을 db에서 경로 참조
        //model의 input과 이미지의 크기를 비교하는 과정이 필요 - 예외처리
        //문제없으면 해당경로의 이미지를 읽어옴
        //epoch과 batch등을 변수에
        //모델을 다시 컴파일한 후 모델 피팅 시작
        //학습결과를 저장
        //학습결과 저장경로를 db에 저장


        //const modelSavePath = `/DB/${req.body.user_name}/${req.body.proj_name}/result`;

        //모델의 input img size와 data의 img사이즈가 다르면 오류처리해야함
        if(proj.data.type == "img"){
            if(proj.data.shape != proj.models[0].layers[0].params.inputShape){
                // res.status(500).json({
                //     message: "Data size and model input size are mismatch"
                // });
                console.log("Data size and model input size are mismatch");
            }
        }else if(proj.data.type == "csv"){
            //csv 는 아직 감이 잘 안잡힘.
        }

        //train image load
        let path = "../public/trainingSet/trainingSet";
        let img_format = proj.data.info.format;
        let img_shape = proj.data.info.shape;
        let imgPath = await datas.dataInit(path, img_format, img_shape);
        const xs = await tf.data.generator(datas.imageGenerator);
        const ys = await tf.data.generator(datas.labelGenerator);
        const ds = await tf.data.zip({xs,ys}).shuffle(imgPath.length).batch(64);
        let model = await getModelFromJson();

        //getModel failed
        if(model == false){
            res.status(500);
        }

        //model train
        let epoch = proj.models[0].fit.epochs;
        let batchs = proj.models[0].fit.batch_size;
        let val_per = proj.models[0].fit.val_data_per;
        let history = await model.fitDataset(ds, {
            epochs:1,
            callbacks : {
                onEpochEnd: async (batch, logs) => {
                console.log(batch + ' : ' + logs.acc);
            }}
        });

        //console.log(history);

        //trained model save
        let modelSavePath = "../";
        if (modelSavePath != null) {
            await model.save(`file://${modelSavePath}`);
            console.log(`Saved model to path: ${modelSavePath}`);
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
        function getType(target) {
            return Object.prototype.toString.call(target);
        }
    },

    async testModel(req, res){
        //학습이 완료된 모델을 테스트함 
        //모델이 제데로 로드되는건 확인완료했습니다.
        
        //test model load
        let saved_model_path = '../';
        const modelPrime = await tf.loadLayersModel(`file://${saved_model_path}/model.json`);
        modelPrime.compile({
            optimizer : proj.models[0].compile.optimizer,
            loss : proj.models[0].compile.loss,
            metrics   : ['accuracy']
        });
        modelPrime.summary();

        //test image load
        let path = "../public/trainingSet/trainingSet";
        let img_format = proj.data.info.format;
        let img_shape = proj.data.info.shape;
        let imgPath = await datas.dataInit(path, img_format, img_shape);
        const xs = await tf.data.generator(datas.imageGenerator);
        const ys = await tf.data.generator(datas.labelGenerator);
        const ds = await tf.data.zip({xs,ys}).shuffle(imgPath.length).batch(64);

        //model evaluation
        const result = await modelPrime.evaluateDataset(ds);

        //print evaluation result
        console.log(`result(loss) : ${result[0]}`);
        console.log(`result(acc) : ${result[1]}`);
    }
};

