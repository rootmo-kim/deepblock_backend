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
    async viewDatasetList(req, res){
        try{
            const dataset_info = await models.Dataset.findAll({
                where : {
                    fk_user_id : req.session.userid, 
                }
            });

            if(!dataset_info.length){
                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "dataset_num" : 0
                });
            }else{
                let dataset_arr = [];
                for(var _dataset of dataset_info){
                    _dataset = _dataset.dataValues;
                    dataset_arr.push({
                        dataset_id : _dataset.id, 
                        dataset_name : _dataset.dataset_name, 
                    });
                }
                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "dataset_num" : dataset_arr.length,
                    "dataset_list" : dataset_arr
                });
            }
        }catch(err){
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async createDataset(req, res){
        let user_dataset_path; 
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const user_dataset = await models.User.findOne({
                include : [{
                    model : models.Dataset,
                    where : {dataset_name : req.body.dataset_name}
                }],
                where : {
                    id : req.session.userid,
                }
            });

            if(user_dataset){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 데이터셋명");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userid}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                user_dataset_path = `${base_path}/${hashId}/${dataset_dir_name}/${req.body.dataset_name}`;
    
                await models.Dataset.create({
                    fk_user_id : req.session.userid,
                    dataset_name : req.body.dataset_name,
                    dataset_path : user_dataset_path
                }, { 
                    transaction 
                });
                await fsp.mkdir(user_dataset_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "dataset 생성 성공");
            }
        }catch(err){
            if(user_dataset_path){
                fs.access(user_dataset_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        rimraf.sync(user_dataset_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async deleteDataset(req, res){
        let user_dataset_path; 
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const user_dataset = await models.User.findOne({
                include : [{
                    model : models.Dataset,
                    where : {id : req.params.dataset_id}
                }],
                where : {
                    id : req.session.userid,
                }
            });

            if(!user_dataset){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                const hashId = crypto.createHash(hash).update(user_dataset.dataValues.username + salt).digest("hex");
                const dataset_name = user_dataset.dataValues.Datasets[0].dataValues.dataset_name;
                user_dataset_path = `${base_path}/${hashId}/${dataset_dir_name}/${dataset_name}`;

                await models.Dataset.destroy({
                    where : {
                        fk_user_id : req.session.userid,
                        id : req.params.dataset_id,
                        dataset_name : dataset_name,
                        dataset_path : user_dataset_path
                    }
                }, { 
                    transaction 
                });

                rimraf.sync(user_dataset_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "dataset 삭제 성공");
            }
        }catch(err){
            console.log(err);
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async updateDatasetName(req, res){
        let before_dataset_path;
        let after_dataset_path;
        let transaction;

        try{
            transaction = await models.sequelize.transaction();

            const before_dataset = await models.User.findOne({
                include : [{
                    model : models.Dataset, 
                    where: {id : req.params.dataset_id}
                }], 
                where : {
                    id : req.session.userid
                }
            });
            const after_dataset = await models.User.findOne({
                include : [{
                    model : models.Dataset, 
                    where: {dataset_name : req.body.after}
                }], 
                where : {
                    id : req.session.userid
                }
            });

            if(!before_dataset){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else if(after_dataset){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 데이터셋명");
            }else{
                const hashId = crypto.createHash(hash).update(before_dataset.dataValues.username + salt).digest("hex");
                const before_dataset_name = before_dataset.dataValues.Datasets[0].dataValues.dataset_name;;
                const after_dataset_name = req.body.after;

                before_dataset_path = `${base_path}/${hashId}/${dataset_dir_name}/${before_dataset_name}`;
                after_dataset_path = `${base_path}/${hashId}/${dataset_dir_name}/${after_dataset_name}`;

                await models.Dataset.update({
                    dataset_name : after_dataset_name,
                    dataset_path : after_dataset_path
                },{
                    where : {
                        fk_user_id : req.session.userid,
                        id : req.params.dataset_id,
                        dataset_name : before_dataset_name,
                        dataset_path : before_dataset_path
                    }
                }, { 
                    transaction 
                });
                await fsp.rename(before_dataset_path, after_dataset_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "dataset 이름 변경성공");
            }
        }catch(err){
            if(after_dataset_path){
                fs.access(after_dataset_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        fsp.rename(after_dataset_path, before_dataset_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    }
};