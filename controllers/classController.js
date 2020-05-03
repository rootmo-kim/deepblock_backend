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
    viewClassList(req, res){
        res_handler.res_success_200(res, "hello");
    },

    createClass(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const class_path = `${base_path}/${hashId}/${data_dir_name}/${req.params.datasets_id}/${req.body.c}`;

        try{
            


        }catch(e){

        }
    },

    deleteClass(req,res){

    },

    updateClassName(req, res){

    },

    loadClass(req, res){

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