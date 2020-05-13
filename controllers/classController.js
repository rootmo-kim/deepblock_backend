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
    loadClassOfDataset(req, res){        
        models.Dataset.findAll({
            include : [{
                model : models.Class
            }], 
            where : {
                userID : req.session.userID, 
                id : req.params.dataset_id
            }
        })
        .then((dataset_info => {
            if(!dataset_info.length){
                responseHandler.custom(res, 200, {
                    "result" : "success",
                    "class_num" : 0,
                    "class_list" : {}
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
                responseHandler.custom(res, 200, {
                    "result" : "success",
                    "class_num" : class_arr.length,
                    "class_list" : class_arr
                });
            }
        }))
        .catch(()=>{
            responseHandler.fail(res, 500,"처리 실패");
        })
    },

    async createClass(req, res){
        let class_path = null;
        let transaction = null;

        try{
            transaction = await models.sequelize.transaction();
            const data_class = await models.Dataset.findOne({
                include : [{
                    model : models.Class,
                    where : {className : req.body.class_name}
                }],
                where : {
                    userID : req.session.userID,
                }
            });

            if(data_class){
                transaction.rollback();
                responseHandler.fail(res, 409, "중복된 이름입니다");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userID}});
                const dataset = await models.Dataset.findOne({where : {id : req.params.dataset_id}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                class_path = `${base_path}/${hashId}/${dataset_dir_name}/${dataset.dataValues.datasetName}/${req.body.class_name}`;
    
                await models.Class.create({
                        datasetID : req.params.dataset_id,
                        className : req.body.class_name,
                        imageCount : 0,
                        classPath : class_path
                }, { 
                    transaction 
                });
                fsp.mkdir(class_path);
                await transaction.commit();
                responseHandler.success(res, 200, "생성 성공");
            }
        }catch(err){
            if(class_path){
                fs.access(class_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        rimraf.sync(class_path);
                    }
                }));
            }
            transaction.rollback();
            responseHandler.fail(res, 500, "처리 실패");
        }
    },

    async deleteClass(req, res){
        let user_class_path = null; 
        let transaction = null;

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
                responseHandler.fail(res, 400, "잘못 된 접근입니다");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userID}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                const dataset_name = dataset_class.dataValues.datasetName;
                const class_name = dataset_class.dataValues.Classes[0].dataValues.className;
                user_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${dataset_name}/${class_name}`;

                await models.Class.destroy({
                    where : {
                        datasetID : req.params.dataset_id,
                        id : req.params.class_id,
                        className : class_name,
                        classPath : user_class_path
                    }
                }, { 
                    transaction 
                });
                rimraf(user_class_path, ((err) => {}));
                await transaction.commit();
                responseHandler.success(res, 200, "삭제 성공");
            }
        }catch(err){
            transaction.rollback();
            responseHandler.fail(res, 500, "처리 실패");
        }
    },

    async updateClassName(req, res){
        let before_class_path = null;
        let after_class_path = null;
        let transaction = null;

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
                    where: {className : req.body.after}
                }], 
                where : {
                    id : req.params.dataset_id
                }
            });

            if(!before_class){
                transaction.rollback();
                responseHandler.fail(res, 400,"잘못 된 접근입니다");
            }else if(after_class){
                transaction.rollback();
                responseHandler.fail(res, 409,"중복된 이름입니다");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userID}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                const before_class_name = before_class.dataValues.Classes[0].dataValues.className;;
                const after_class_name = req.body.after;

                before_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${before_class.dataValues.datasetName}/${before_class_name}`;
                after_class_path = `${base_path}/${hashId}/${dataset_dir_name}/${before_class.dataValues.datasetName}/${after_class_name}`;

                await models.Class.update({
                    className : after_class_name,
                    classPath : after_class_path
                },{
                    where : {
                        datasetID : req.params.dataset_id,
                        id : req.params.class_id,
                        className : before_class_name,
                        classPath : before_class_path
                    }
                }, { 
                    transaction 
                });
                fsp.rename(before_class_path, after_class_path);
                await transaction.commit();
                responseHandler.success(res, 200,"이름변경 성공");
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
            responseHandler.fail(res, 500,"처리 실패");
        }
    }
}