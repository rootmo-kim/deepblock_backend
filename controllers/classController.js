'use strict';

const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
const rimraf = require('rimraf');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const data_dir_name = require('../config/configs').datasets;
const res_handler = require('./responeHandler');

module.exports = {
    async viewClassList(req, res){        
        try{
            const dataset_info = await models.Dataset.findAll({
                include : [{
                    model : models.Class
                }], 
                where : {
                    fk_user_id : req.params.id, 
                    id : req.params.dataset_id
                }
            });

            if(!dataset_info.length || dataset_info.length>1){
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                let classes = dataset_info[0].dataValues.Classes;
                let class_arr = [];
                for(var _class of classes){
                    _class = _class.dataValues;
                    class_arr.push({
                        class_id : _class.id, 
                        class_name : _class.class_name, 
                        image_num : _class.image_num
                    });
                }

                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "class_num" : class_arr.length,
                    "class_list" : class_arr
                });
            }
        }catch(err){
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async createClass(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const user_dataset_path = `${base_path}/${hashId}/${data_dir_name}`;
        let class_path=null;
        let transaction;

        try{
            const dataset = await models.Dataset.findOne({
                where : {
                    id : req.params.dataset_id,
                    fk_user_id : req.params.id
                }
            });

            if(!dataset){
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                transaction = await models.sequelize.transaction();
                class_path = `${user_dataset_path}/${dataset.dataValues.dataset_name}/${req.body.class_name}`;
                
                if(await models.Class.findOne({where : {fk_dataset_id : req.params.dataset_id, class_name : req.body.class_name}})){
                    transaction.rollback();
                    res_handler.resFail400(res, "중복된 클래스명");
                }else{
                    await models.Class.create({
                        fk_dataset_id : req.params.dataset_id,
                        class_name : req.body.class_name,
                        image_num : 0,
                        class_path : class_path
                    }, { 
                        transaction 
                    });

                    await fsp.mkdir(class_path);
                    await transaction.commit();
                    await res_handler.syncResSuccess201(res, "class 생성 성공");
                }
            }
        }catch(err){
            fs.access(class_path, fs.constants.F_OK, ((e)=>{
                if(!e){
                    rimraf.sync(class_path);
                }
                transaction.rollback();
                res_handler.syncResFail500(res, "처리 실패");
            }));
        }
    },

    async deleteClass(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const user_dataset_path = `${base_path}/${hashId}/${data_dir_name}`;
        let class_path;
        let transaction;

        try{
            const dataset = await models.Dataset.findOne({
                include : [{
                    model : models.Class, 
                    where: {id : req.params.class_id}
                }], 
                where : {
                    fk_user_id : req.params.id, 
                    id : req.params.dataset_id
                }
            });

            if(!dataset){
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                const dataset_name = dataset.dataValues.dataset_name;
                const class_name = dataset.dataValues.Classes[0].dataValues.class_name;

                transaction = await models.sequelize.transaction();
                class_path = `${user_dataset_path}/${dataset_name}/${class_name}`;
            
                await models.Class.destroy({
                    where : {
                        fk_dataset_id : req.params.dataset_id,
                        id : req.params.class_id,
                        class_name : class_name,
                        class_path : class_path
                    }
                }, { 
                    transaction 
                });
                rimraf.sync(class_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "class 삭제 성공");
            }
        }catch(err){
            console.log(err);
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async updateClassName(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const user_dataset_path = `${base_path}/${hashId}/${data_dir_name}`;
        let before_class_path;
        let after_class_path;
        let transaction;

        try{
            const before = await models.Dataset.findOne({
                include : [{
                    model : models.Class, 
                    where: {id : req.params.class_id}
                }], 
                where : {
                    fk_user_id : req.params.id, 
                    id : req.params.dataset_id
                }
            });

            if(!before){
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                const dataset_name = before.dataValues.dataset_name;
                const before_class_name = before.dataValues.Classes[0].dataValues.class_name;
                const after_class_name = req.body.after;

                transaction = await models.sequelize.transaction();
                
                before_class_path = `${user_dataset_path}/${dataset_name}/${before_class_name}`;
                after_class_path = `${user_dataset_path}/${dataset_name}/${after_class_name}`;

                if(await models.Class.findOne({where : {fk_dataset_id : req.params.dataset_id, class_name : after_class_name}})){
                    transaction.rollback();
                    res_handler.resFail400(res, "중복된 클래스명");
                }else{
                    await models.Class.update({
                        class_name : req.body.after,
                        class_path : after_class_path
                    },{
                        where : {
                            fk_dataset_id : req.params.dataset_id,
                            id : req.params.class_id,
                            class_name : before_class_name,
                            class_path : before_class_path
                        }
                    }, { 
                        transaction 
                    });
                    await fsp.rename(before_class_path, after_class_path);
                    await transaction.commit();
                    await res_handler.syncResSuccess201(res, "class이름 변경성공");
                }
            }
        }catch(err){
            fs.access(after_class_path, fs.constants.F_OK, ((e)=>{
                if(!e){
                    fsp.rename(after_class_path, before_class_path);
                }
                transaction.rollback();
                res_handler.syncResFail500(res, "처리 실패");
            }));
        }
    },

    loadClass(req, res){
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
//
    deleteImage(req, res){

    },

}