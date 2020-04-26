const crypto = require("crypto");
const models = require("../models");
const salt = "s34i0mas21";
var fs = require('fs');

module.exports = {
    viewProject(req, res){

        //find부분 필요
        console.log('viewProject');
        res.status(200).send("성공!");
    },

    createProject(req, res){
        // models.project.create({
        //     project_name: req.body.project_name,
        //     path: req.body.path
        // })
        // .then((project) => {
        //     fs.access(`path/${req.body.project_name}`, fs.constants.F_OK, (err)=>{
        //         if(err){
        //             if(err.code === 'ENOENT'){
        //                 console.log('해당 디렉토리 없음');
        //                 fs.mkdir(`path/${req.body.project_name}`,function(err){
        //                     if(err){
        //                         throw err;
        //                     }
        //                     console.log('디렉토리 생성');     
        //                 })
        //             }
        //         }
        //     })
        //     res.status(200).json({
        //         message: "프로젝트 디렉토리 생성 완료"
        //     })
        // })
        // .catch((error) => {
        //     res.status(500).json({
        //         message: "실패"
        //     })
        // })
        console.log('createProject');
        console.log(req.body.project_name);
    },

    deleteProject(req, res){
        console.log('deleteProject');
    },
    loadProject(req, res){
        console.log('loadProject');
    }
};