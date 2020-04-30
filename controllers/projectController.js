const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');

const models = require("../models");
const salt = require('../config/config').salt;
const base_path = require('../config/config').base_path;
const hash = require('../config/config').hash;
const project_dir_name = require('../config/config').projects;

module.exports = {
    viewProject(req, res){
        models.Project.findAll({
            where : {
                fk_user_id : req.params.id,
            } 
        })
        .then((proj) => {
            if(proj.length != 0){
                var proj_arr = [];
                for(var _proj of proj){
                    proj_arr.push({proj_name : _proj.dataValues.project_name});
                }
                res.status(200).json({
                    success : 'true',
                    proj_num : proj_arr.length,
                    proj_arr : proj_arr
                })
            }else{
                res.status(200).json({
                    success : 'true',
                    massege : '생성된 프로젝트가 없습니다.'
                })
            }
        })
        .catch((err) => {
            res.status(500).json({
                success : 'false',
                massege : '프로젝트 검색 실패'
            })
        })
    },

    createProject(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const proj_path = `${base_path}/${hashId}/${project_dir_name}/${req.body.project_name}`;

        models.Project.findOne({
            where : {
                fk_user_id : req.params.id,
                project_name : req.body.project_name
            } 
        })
        .then((proj) => {
            if(proj){
                res.status(403).json({
                    success : 'false',
                    message : "중복된 프로젝트이름 입니다."
                })
            }else{
                models.Project.create({
                    fk_user_id : req.params.id,
                    project_name: req.body.project_name,
                    path: proj_path
                })
                .then(() => {
                    fs.mkdir(proj_path , ((err) => {
                        res.status(500).json({
                            success : "false",
                            message: "프로젝트 생성 실패"
                        })
                    }));
                    res.status(200).json({
                        success : 'true',
                        message: "프로젝트 생성 성공"
                    })
                })
                .catch(() => {
                    res.status(500).json({
                        success : 'false',
                        message: "프로젝트 생성 실패"
                    })
                })
            }
        }).catch(()=>{
            res.status(500).json({
                success : "false",
                message: "프로젝트 생성 실패"
            })
        })
    },

    deleteProject(req, res){
        const hashId = crypto.createHash(hash).update(req.params.id + salt).digest("hex");
        const proj_path = `${base_path}/${hashId}/${project_dir_name}/${req.body.project_name}`;

        models.Project.destroy({
            where : {
                fk_user_id : req.params.id,
                project_name : req.body.project_name
            }
        })
        .then((proj) => {
            console.log(proj);
            if(proj){
                rimraf.sync(proj_path);
                res.status(200).json({
                    success : 'true',
                    message: "프로젝트 삭제 성공"
                })
            }else{
                res.status(500).json({
                    success : 'false',
                    message: "존재하지않는 프로젝트"
                })
            }
        })
        .catch(() => {
            res.status(500).json({
                success : "false",
                message: "프로젝트 삭제 실패"
            })
        })
    },

    loadProject(req, res){
        console.log('loadProject');
    }
};
