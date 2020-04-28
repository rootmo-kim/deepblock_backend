let fs = require("fs");
let path = require("path");
let rimraf = require('rimraf');

exports.diretoryMiddleware = function(req, res, next){
    //TOTO : user name 해쉬화 필요
    let user_name = req.query.id;
    let dataset_name = req.query.name;
    let data_labels = req.body.data_labels;

    let dataset_path = `C:/Users/JinSung/Desktop/deepblock_git/tfjs_practice/${user_name}/${dataset_name}`;
    let base_dataset_path = path.normalize(dataset_path);

    const p =new Promise((resolve, reject) => {
        if(fs.existsSync(base_dataset_path)){
            reject("Duplicate dataset name");
        }else{
            fs.mkdirSync(base_dataset_path);
            for(var _label of data_labels){
                let label_path = path.normalize(`${base_dataset_path}/${_label}`);
                if(fs.existsSync(label_path)){
                    rimraf.sync(`${base_dataset_path}`);
                    reject("Duplicate label name");
                }else{
                    fs.mkdirSync(label_path);
                }
            }
        }
        resolve();
    });
    p.then(() => {
        console.log("Making directory success");
        next();
    })
    .catch(function(massege){
        console.log("Making directory failed");
        res.status(403).json({
            success : false,
            message : massege
        });
    });
};
