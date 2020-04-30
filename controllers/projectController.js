const crypto = require("crypto");
const fs = require('fs');

const models = require("../models");
const salt = require('../config/config').salt;
const base_path = require('../config/config').base_path;
const hash = require('../config/config').hash;
const project_dir_name = req('../config/config').projects;
const data_dir_name = req('../config/config').datasets;

module.exports = {
    viewProject(req, res){
        //외래키 참조해서
        //find부분 필요
        console.log('viewProject');
        res.status(200).send("성공!");
    },

    createProject(req, res){
        const hashId = crypto.createHash(hash).update(req.query.id + salt).digest("hex");
        const proj_path = `${base_path}/${hashId}/${req.body.project_name}`;

        models.Project.create({
            project_name: req.body.project_name,
            path: proj_path
        })
        .then(() => {
            fs.mkdir(proj_path ,function(err){
                if(err){
                    throw err;
                }
                console.log('디렉토리 생성');     
            })
            res.status(200).json({
                message: "프로젝트 디렉토리 생성 완료"
            })
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                message: "실패"
            })
        })
    },

    deleteProject(req, res){
        //Todo: 디렉토리 삭제 구현
    //     const hashId = crypto.createHash(hash).update(req.query.id + salt).digest("hex");
    //     const proj_path = `${base_path}/${hashId}/${req.body.project_name}`;

    //     models.User.destroy({
    //         where:{
    //             project_name: req.body.projet_name,
    //         }
    //     })
    //     .then(() => {
    //         fs.readdir(proj_path, (err,dir) =>{
    //             if(err){
    //                 throw err;
    //             }
    //             console.log('디렉토리 내용 확인', dir);
    
    //             fs.rmdir(proj_path, (err) =>{
    //                 if(err){
    //                     throw err;
    //                 }
    //                 res.status(200).json({
    //                     message: "프로젝트 삭제 성공"
    //                 })
    //             })
    //         })
    //     })
    //     .catch(() => {
    //         res.status(500).json({
    //             message: "해당 프로젝트가 없음"
    //         })
    //     })
    },
    loadProject(req, res){
        console.log('loadProject');
    }
};
