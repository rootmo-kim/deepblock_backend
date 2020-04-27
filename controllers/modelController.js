let fs      = require('fs');
let tf      = require("@tensorflow/tfjs-node");
let path    = require("path");
let data_loader   = require("./data");

//삭제 예정
let proj    = require("../public/json/model_info.json");


module.exports = {
    async trainModel(req, res){
        //const modelSavePath = `/DB/${req.body.user_name}/${req.body.proj_name}/result`;
        let history;
        let model;
        //let data_path = '../public/mnist/trainingSet/trainingSet';
        let data_path = path.normalize('C:/Users/JinSung/Desktop/deepblock_git/tfjs_practice/public/mnist/trainingSet/trainingSet');
        //let proj = path.normalize('');
        
        if(proj.data.type == "img"){
            //train image load
             // 실제론 db에서 질의
            let img_format = proj.data.info.format; // 강제로 png사용하게 변환
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
            //csv 는 아직 감이 잘 안잡힘.
        }else{
            console.log(`지원하지 않는 데이터 타입`);
            return false;
        }

        //history 출력가능
        console.log(history);

        //trained model save
        let modelSavePath = "../"; //실제론 사용자와 db의 프로젝트 경로를 사용해서 save경로 선택
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
        //학습이 완료된 모델을 테스트함 
        //모델이 제데로 로드되는건 확인완료했습니다.
        
        //test model load
        let modelPrime;
        let saved_model_path = '../'; //실제론 db에서 질의
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
        let path = "../public/mnist/trainingSet/trainingSet"; //실제론 db질의
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

