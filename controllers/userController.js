const crypto = require("crypto");
const fs = require('fs');

const models = require("../models");
const salt = require('../config/config').salt;
const base_path = require('../config/config').base_path;
const hash = require('../config/config').hash;


//디렉토리 경로 나중에 서버로 바꿀꺼여~
module.exports = {
    register(req, res){
        // [Comment] 입력 받는 user_id 와 password 값 express-validator로 검증할 것
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");

        models.User.create({
            user_name: req.body.user_name,
            email: req.body.email,
            password: hashPassword
        })

        .then(() => {
            //개인 디렉토리 생성 //Todo: 개인 디렉토리 생성시 프로젝트, 데이터셋 디렉토리 생성
            fs.mkdir(`${base_path}/${hashId}`,function(err){
                if(err){
                    throw err;
                }
                console.log('디렉토리 생성');     
            })
            res.status(200).json({
                message: "회원가입 성공"
            })
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                message: "회원가입 실패(해당 아이디가 이미 존재)"
            })
        })
    },

    unregister(req, res){
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");

        models.User.destroy({
            where:{
                user_name: req.body.user_name,
            }
        })
        .then(() => {
            fs.readdir(`${base_path}/${hashId}`, (err,dir) =>{
                if(err){
                    throw err;
                }
                console.log('디렉토리 내용 확인', dir);
    
                fs.rmdir(`${base_path}/${hashId}`, (err) =>{
                    if(err){
                        throw err;
                    }
                    res.status(200).json({
                        message: "회원탈퇴 성공"
                    })
                })
            })
        })
        .catch(() => {
            res.status(500).json({
                message: "회원탈퇴 실패(정보가 틀림)"
            })
        })
    },

    login(req, res){
        //로그인
        let hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where: {
                user_name: req.body.user_name,
                password: hashPassword
            }
        })
        .then((user) => {
            if(!user){
                res.status(200).json({
                    message: "아이디 또는 비밀번호가 틀림"
                })
            } else {
                req.session.user_name = req.body.user_name;
                res.clearCookie('sid');
                res.status(200).json({
                    message: "로그인 성공"
                })
            }
            
        })
        .catch(() =>{
            res.status(500).json({
                message: "오류"
            })
        });
    },

    logout(req, res){
        //로그아웃
        req.session.destroy(() => {
            req.session;
        });
        res.clearCookie('sid');
        res.status(200).json({
          message: "로그아웃 성공"
        });
        //res.redirect('/');

    },
};
