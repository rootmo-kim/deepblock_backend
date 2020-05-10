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
const res_handler = require('../utils/responseHandler');

module.exports = {
    async loadClassOfDataset(req, res){        
        try{
            const dataset_info = await models.Dataset.findAll({
                include : [{
                    model : models.Class
                }], 
                where : {
                    fk_user_id : req.session.userid, 
                    id : req.params.dataset_id
                }
            });

            if(!dataset_info.length){
                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "class_num" : 0,
                });
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
        let class_path;
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const data_class = await models.Dataset.findOne({
                include : [{
                    model : models.Class,
                    where : {class_name : req.body.class_name}
                }],
                where : {
                    fk_user_id : req.session.userid,
                }
            });

            if(data_class){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 클래스명");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userid}});
                const dataset = await models.Dataset.findOne({where : {id : req.params.dataset_id}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                class_path = `${base_path}/${hashId}/${dataset_dir_name}/${dataset.dataValues.dataset_name}/${req.body.class_name}`;
    
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
        }catch(err){
            console.log(err);
            if(class_path){
                fs.access(class_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        rimraf.sync(class_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async deleteClass(req, res){
        let user_class_path; 
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const dataset_class = await models.Dataset.findOne({
                include : [{
                    model : models.Class,
                    where : {id : req.params.class_id}
                }],
                where : {
                    id : req.params.dataset_id,
                }
            });

            if(!dataset_class){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userid}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                const dataset_name = dataset_class.dataValues.dataset_name;
                const class_name = dataset_class.dataValues.Classes[0].dataValues.class_name;
                user_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${dataset_name}/${class_name}`;

                await models.Class.destroy({
                    where : {
                        fk_dataset_id : req.params.dataset_id,
                        id : req.params.class_id,
                        class_name : class_name,
                        class_path : user_class_path
                    }
                }, { 
                    transaction 
                });

                rimraf.sync(user_class_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "class 삭제 성공");
            }
        }catch(err){
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async updateClassName(req, res){
        let before_class_path;
        let after_class_path;
        let transaction;

        try{
            transaction = await models.sequelize.transaction();

            const before_class = await models.Dataset.findOne({
                include : [{
                    model : models.Class, 
                    where: {id : req.params.class_id}
                }], 
                where : {
                    id : req.params.dataset_id
                }
            });
            const after_class = await models.Dataset.findOne({
                include : [{
                    model : models.Class, 
                    where: {class_name : req.body.after}
                }], 
                where : {
                    id : req.params.dataset_id
                }
            });

            if(!before_class){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else if(after_class){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 클래스명");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userid}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                const before_class_name = before_class.dataValues.Classes[0].dataValues.class_name;;
                const after_class_name = req.body.after;

                before_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${before_class.dataValues.dataset_name}/${before_class_name}`;
                after_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${before_class.dataValues.dataset_name}/${after_class_name}`;

                await models.Class.update({
                    class_name : after_class_name,
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
                await res_handler.syncResSuccess201(res, "class 이름 변경성공");
            }
        }catch(err){
            if(after_class_path){
                fs.access(after_class_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        fsp.rename(after_class_path, before_class_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    }
}