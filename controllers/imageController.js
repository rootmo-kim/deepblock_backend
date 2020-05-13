'use strict';

const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
const rimraf = require('rimraf');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const dataset_dir_name = require('../config/configs').datasets;
const responseHandler = require('../utils/responseHandler');

module.exports = {
    sendClassImage(req, res){
        //image 썸네일 보기
        
    },

    uploadImage(req ,res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const dataset_path = `${base_path}/${hashId}/${data_dir_name}/${req.body.dataset_name}`;
        var add_file_cnt = req.files.length;

        console.log(req.files);

        if(!add_file_cnt){
            res.status(200).json({
                success : "false",
                massege : "이미지를 선택해주세요"
            })
        }
    },

    deleteImage(req, res){

    },
}