'use strict'

const models = require("../models");
const responseHandler = require('../utils/responseHandler');

const navigator = (req, res, next) => {    
    models.Dataset.findOne({
        include : [{
            model : models.Class, 
            where: {id : req.params.class_id}
        }], 
        where : {
            id : req.params.dataset_id
        }
    }).then((exist)=>{
        if(exist){
            req.dataset_path = exist.dataValues.datasetPath;
            req.original_path = exist.dataValues.Classes[0].dataValues.originalPath;
            req.thumbnail_path = exist.dataValues.Classes[0].dataValues.thumbnailPath;

            console.log("navi success");
            next();
        }else{
            console.log("navi failed");
            responseHandler.fail(res, 400 , "잘못 된 접근")
        }
    }).catch((err)=>{
        console.log(err);
        responseHandler.fail(res, 500, "처리 실패");
    })
};

module.exports = navigator;