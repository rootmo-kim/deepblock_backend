const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const data_dir_name = require('../config/configs').datasets;
const res_handler = require('./responeHandler');

module.exports = {
    viewDatasetList(req, res){
        models.Dataset.findAll({
            where : {
                fk_user_id : req.params.id,
            } 
        })
        .then((dataset) => {
            if(proj.length != 0){
                var dataset_arr = [];
                for(var _dataset of dataset){
                    dataset_arr.push({dataset_name : _dataset.dataValues.dataset_name});
                }
                res.status(200).json({
                    success : 'true',
                    dataset_num : dataset_arr.length,
                    dataset_arr : dataset_arr
                })
            }else{
                res.status(200).json({
                    success : 'true',
                    massege : '생성된 데이터셋이 없습니다.'
                })
            }
        })
        .catch((err) => {
            res.status(500).json({
                success : 'false',
                massege : '데이터셋 검색 실패'
            })
        })
    },

    createDataset(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const dataset_path = `${base_path}/${hashId}/${data_dir_name}/${req.body.dataset_name}`;

        models.Dataset.findOne({
            where : {
                fk_user_id : req.params.id,
                dataset_name : req.body.dataset_name
            } 
        })
        .then((dataset) => {
            if(dataset){
                res.status(403).json({
                    success : 'false',
                    message : "중복된 데이터셋이름 입니다."
                })
            }else{
                models.Dataset.create({
                    fk_user_id : req.params.id,
                    dataset_name: req.body.dataset_name,
                    path: dataset_path
                })
                .then(() => {
                    fs.mkdir(dataset_path , (() => {
                        res.status(500).json({
                            success : "false",
                            message: "데이터셋 생성 실패"
                        })
                    }));
                    res.status(200).json({
                        success : 'true',
                        message: "데이터셋 생성 성공"
                    })
                })
                .catch(() => {
                    res.status(500).json({
                        success : 'false',
                        message: "데이터셋 생성 실패"
                    })
                })
            }
        }).catch(()=>{
            res.status(500).json({
                success : "false",
                message: "데이터셋 생성 실패"
            })
        })
    },

    deleteDataset(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const dataset_path = `${base_path}/${hashId}/${data_dir_name}/${req.body.dataset_name}`;

        models.Dataset.destroy({
            where : {
                fk_user_id : req.params.id,
                dataset_name : req.body.dataset_name
            }
        })
        .then((dataset) => {
            if(dataset){
                rimraf.sync(dataset_path);
                res.status(200).json({
                    success : 'true',
                    message: "데이터셋 삭제 성공"
                })
            }else{
                res.status(500).json({
                    success : 'false',
                    message: "존재하지않는 데이터셋"
                })
            }
        })
        .catch(() => {
            res.status(500).json({
                success : "false",
                message: "데이터셋 삭제 실패"
            })
        })
    },

    updateDatasetName(req, res){
        
    },

    loadDataset(req, res){
        
    }
};