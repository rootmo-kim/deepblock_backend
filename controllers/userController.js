const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');

const models = require("../models");
const salt = require('../config/config').salt;
const base_path = require('../config/config').base_path;
const hash = require('../config/config').hash;
const project_dir_name = require('../config/config').projects;
const data_dir_name = require('../config/config').datasets;


module.exports = {
    register(req, res){
        // [Comment] 입력 받는 user_id 와 password 값 express-validator로 검증할 것
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.create({
            user_name: req.body.user_name,
            email: req.body.email,
            password: hashPassword
        })
        .then(() => {
            //개인 디렉토리 생성 //Todo: 개인 디렉토리 생성시 프로젝트, 데이터셋 디렉토리 생성
            fs.mkdirSync(path.normalize(`${base_path}/${hashId}`));
            fs.mkdir(path.normalize(`${base_path}/${hashId}/${project_dir_name}`), ((err)=>{
                console.log(err);
            }));
            fs.mkdir(path.normalize(`${base_path}/${hashId}/${data_dir_name}`), ((err)=>{
                console.log(err);
            }));

            res.status(200).json({
                success : "true",
                message: "회원가입 성공"
            })
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                success : 'false',
                message: "중복된 아이디 입니다"
            })
        })
    },

    unregister(req, res){
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.destroy({
            where:{
                password : hashPassword,
                user_name: req.body.user_name
            }
        })
        .then(() => {
            rimraf.sync(`${base_path}/${hashId}`);
            res.status(200).json({
                success : 'true',
                message : "회원탈퇴 성공"
            })
        })
        .catch(() => {
            res.status(500).json({
                success : 'false',
                message : "회원탈퇴 실패(정보가 틀림)"
            })
        })
    },

    login(req, res){
        //로그인
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where: {
                user_name: req.body.user_name,
                password: hashPassword
            }
        })
        .then((user) => {
            if(!user){
                res.status(200).json({
                    success : "false",
                    message: "아이디 또는 비밀번호를 잘 못 입력하셨습니다."
                })
            } else {
                req.session.user_name = req.body.user_name;
                res.clearCookie('sid');
                res.status(200).json({
                    success : "true",
                    message : "로그인 성공"
                })
            }
        })
        .catch(() =>{
            res.status(500).json({
                success : 'false',
                message : "다시 시도해주세요."
            })
        });
    },

    logout(req, res){
        //로그아웃
        //TODO
        //Coment : authMiddleware 구현 후 테스트 가능하니 authMiddleware 구현 빠르게 해야함
        req.session.destroy(() => {
            req.session;
        });
        res.clearCookie('sid');
        res.status(200).json({
            success : 'true',
            message : "로그아웃 성공"
        });
    },
};
