'use strict';

const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
const rimraf = require('rimraf');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const project_dir_name = require('../config/configs').projects;
const res_handler = require('./responeHandler');

module.exports = {
    async viewProjectList(req, res){
        try{
            const projects_info = await models.Project.findAll({
                where : {
                    fk_user_id : req.params.id, 
                }
            });

            if(!projects_info.length){
                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "project_num" : 0
                });
            }else{
                let proj_arr = [];
                for(var _project of projects_info){
                    _project = _project.dataValues;
                    proj_arr.push({
                        project_id : _project.id, 
                        project_name : _project.project_name, 
                    });
                }
                res_handler.resCustom(res, 200, {
                    "result" : "success",
                    "project_num" : proj_arr.length,
                    "project_list" : proj_arr
                });
            }
        }catch(err){
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async createProject(req, res){
        let user_project_path; 
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const user_proj = await models.User.findOne({
                include : [{
                    model : models.Project,
                    where : {project_name : req.body.project_name}
                }],
                where : {
                    id : req.params.id,
                }
            });

            if(user_proj){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 프로젝트명");
            }else{
                const user = await models.User.findOne({where : {id : req.params.id}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                user_project_path = `${base_path}/${hashId}/${project_dir_name}/${req.body.project_name}`;
    
                await models.Project.create({
                    fk_user_id : req.params.id,
                    project_name : req.body.project_name,
                    project_path : user_project_path
                }, { 
                    transaction 
                });
                await fsp.mkdir(user_project_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "project 생성 성공");
            }
        }catch(err){
            if(user_project_path){
                fs.access(user_project_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        rimraf.sync(user_project_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    async deleteProject(req, res){
        let user_project_path; 
        let transaction;

        try{
            transaction = await models.sequelize.transaction();
            const user_proj = await models.User.findOne({
                include : [{
                    model : models.Project,
                    where : {id : req.params.project_id}
                }],
                where : {
                    id : req.params.id,
                }
            });

            if(!user_proj){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else{
                const hashId = crypto.createHash(hash).update(user_proj.dataValues.username + salt).digest("hex");
                const project_name = user_proj.dataValues.Projects[0].dataValues.project_name;
                user_project_path = `${base_path}/${hashId}/${project_dir_name}/${project_name}`;

                await models.Project.destroy({
                    where : {
                        fk_user_id : req.params.id,
                        id : req.params.project_id,
                        project_name : project_name,
                        project_path : user_project_path
                    }
                }, { 
                    transaction 
                });

                rimraf.sync(user_project_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "class 삭제 성공");
            }
        }catch(err){
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },


    async updateProjectName(req, res){
        let before_project_path;
        let after_project_path;
        let transaction;

        try{
            transaction = await models.sequelize.transaction();

            const before_project = await models.User.findOne({
                include : [{
                    model : models.Project, 
                    where: {id : req.params.project_id}
                }], 
                where : {
                    id : req.params.id
                }
            });
            const after_project = await models.User.findOne({
                include : [{
                    model : models.Project, 
                    where: {project_name : req.body.after}
                }], 
                where : {
                    id : req.params.id
                }
            });

            if(!before_project){
                transaction.rollback();
                res_handler.resFail400(res, "잘못 된 요청");
            }else if(after_project){
                transaction.rollback();
                res_handler.resFail400(res, "중복된 클래스명");
            }else{
                const hashId = crypto.createHash(hash).update(before_project.dataValues.username + salt).digest("hex");
                const before_project_name = before_project.dataValues.Projects[0].dataValues.project_name;;
                const after_project_name = req.body.after;

                before_project_path = `${base_path}/${hashId}/${project_dir_name}/${before_project_name}`;
                after_project_path = `${base_path}/${hashId}/${project_dir_name}/${after_project_name}`;

                await models.Project.update({
                    project_name : after_project_name,
                    project_path : after_project_path
                },{
                    where : {
                        fk_user_id : req.params.id,
                        id : req.params.project_id,
                        project_name : before_project_name,
                        project_path : before_project_path
                    }
                }, { 
                    transaction 
                });
                await fsp.rename(before_project_path, after_project_path);
                await transaction.commit();
                await res_handler.syncResSuccess201(res, "project 이름 변경성공");
            }
        }catch(err){
            if(after_project_path){
                fs.access(after_project_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        fsp.rename(after_project_path, before_project_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    }
};
