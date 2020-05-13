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
const responseHandler = require('../utils/responseHandler');

module.exports = {
    viewProjectList(req, res){
        models.Project.findAll({
            where : {
                userID : req.session.userID, 
            }
        })
        .then((project_list)=> {
            if(!project_list.length){
                responseHandler.custom(res, 200, {
                    "result" : "success",
                    "project_num" : 0,
                    "project_list" : {}
                });
            }else{
                let proj_arr = [];
                for(var _project of project_list){
                    _project = _project.dataValues;
                    proj_arr.push({ 
                        project_id : _project.id,  
                        project_name : _project.projectName
                    });
                }
                responseHandler.custom(res, 200, {
                    "result" : "success",
                    "project_num" : proj_arr.length,
                    "project_list" : proj_arr
                });
            }
        })
        .catch((err) => {
            responseHandler.fail(res, 500, "처리 실패");
        })
    },

    async createProject(req, res){
        let user_project_path = null; 
        let transaction = null;

        try{
            transaction = await models.sequelize.transaction();
            const user_proj = await models.User.findOne({
                include : [{
                    model : models.Project,
                    where : {projectName : req.body.project_name}
                }],
                where : {
                    id : req.session.userID,
                }
            });

            if(user_proj){
                transaction.rollback();
                responseHandler.fail(res, 409, "중복된 이름입니다");
            }else{
                const user = await models.User.findOne({where : {id : req.session.userID}});
                const hashId = crypto.createHash(hash).update(user.dataValues.username + salt).digest("hex");
                user_project_path = `${base_path}/${hashId}/${project_dir_name}/${req.body.project_name}`;
    
                await models.Project.create({
                    userID : req.session.userID,
                    projectName : req.body.project_name,
                    projectPath : user_project_path
                }, { 
                    transaction 
                });
                fsp.mkdir(user_project_path);
                await transaction.commit();
                responseHandler.success(res, 200, "생성 성공");
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
            responseHandler.fail(res, 500, "처리 실패");
        }
    },

    async deleteProject(req, res){
        let user_project_path = null; 
        let transaction = null;

        try{
            transaction = await models.sequelize.transaction();
            const user_proj = await models.User.findOne({
                include : [{
                    model : models.Project,
                    where : {id : req.params.project_id}
                }],
                where : {
                    id : req.session.userID,
                }
            });

            if(!user_proj){
                transaction.rollback();
                responseHandler.fail(res, 400, "잘못 된 접근입니다");
            }else{
                const hashId = crypto.createHash(hash).update(user_proj.dataValues.username + salt).digest("hex");
                const project_name = user_proj.dataValues.Projects[0].dataValues.projectName;
                user_project_path = `${base_path}/${hashId}/${project_dir_name}/${project_name}`;

                await models.Project.destroy({
                    where : {
                        userID : req.session.userID,
                        id : req.params.project_id,
                        projectName : project_name,
                        projectPath : user_project_path
                    }
                }, { 
                    transaction 
                });
                rimraf(user_project_path, ((err) => {}));
                await transaction.commit();
                responseHandler.success(res, 200, "삭제 성공");
            }
        }catch(err){
            transaction.rollback();
            responseHandler.fail(res, 500, "처리 실패");
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
                    id : req.session.userID
                }
            });
            const after_project = await models.User.findOne({
                include : [{
                    model : models.Project, 
                    where: {projectName : req.body.after}
                }], 
                where : {
                    id : req.session.userID
                }
            });

            if(!before_project){
                transaction.rollback();
                responseHandler.fail(res, 400, "잘못 된 접근입니다");
            }else if(after_project){
                transaction.rollback();
                responseHandler.fail(res, 409,"중복된 이름입니다");
            }else{
                const hashId = crypto.createHash(hash).update(before_project.dataValues.username + salt).digest("hex");
                const before_project_name = before_project.dataValues.Projects[0].dataValues.projectName;;
                const after_project_name = req.body.after;

                before_project_path = `${base_path}/${hashId}/${project_dir_name}/${before_project_name}`;
                after_project_path = `${base_path}/${hashId}/${project_dir_name}/${after_project_name}`;

                await models.Project.update({
                    projectName : after_project_name,
                    projectPath : after_project_path
                },{
                    where : {
                        userID : req.session.userID,
                        id : req.params.project_id,
                        projectName : before_project_name,
                        projectPath : before_project_path
                    }
                }, { 
                    transaction 
                });
                fsp.rename(before_project_path, after_project_path);
                await transaction.commit();
                responseHandler.success(res, 200, "이름변경 성공");
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
            responseHandler.fail(res, 500, "처리 실패");
        }
    }
};
