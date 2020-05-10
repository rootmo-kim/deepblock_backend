const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const nodemailer = require('nodemailer');
const smtpTransporter = require('nodemailer-smtp-transport');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const project_dir_name = require('../config/configs').projects;
const data_dir_name = require('../config/configs').datasets;
const res_handler = require('../utils/responseHandler');
const admin_email = require('../config/configs').admin_email;
const admin_password = require('../config/configs').admin_password;
const admin_email_service = require('../config/configs').admin_email_service;

smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: admin_email_service,
    auth: {
        user: admin_email,
        pass: admin_password
    }
}));

module.exports = {
    register(req, res){
        // [Comment] 입력 받는 user_id 와 password 값 express-validator로 검증할 것
        const hashId = crypto.createHash(hash).update(req.body.username + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        const original_key = crypto.randomBytes(256).toString('hex');
        const key_start = original_key.substr(100, 16);
        const key_end = original_key.substr(50, 16);
        const hashKey = key_start + key_end;
        const url = `http://localhost:8000/verifyEmail?key=${hashKey}`;

        models.User.findOne({
            where : {
                username: req.body.username
            } 
        })
        .then((user)=>{
            if(user){
                res_handler.resFail400(res, "중복된 아이디 입니다");
            }else{
               models.User.create({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashPassword,
                    verify_key: hashKey
                })
                .then(() => {
                    fs.mkdir(path.normalize(`${base_path}/${hashId}`), ((err) => {
                        if(err){
                            console.log(err);
                            res_handler.resFail400(res, "회원가입 실패");
                        }else{
                            let mailOptions = {
                                from: "deepblock.developer@gmail.com",
                                to: req.body.email,
                                subject: "deepblock - 이메일 인증을 해주세요",
                                html: "<h1>이메일 인증을 위해 URL을 클릭해주세요</h1>" + url
                            };
                            smtpTransport.sendMail(mailOptions, (err, info) => {
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log("email sent");
                                }
                                smtpTransport.close();
                            });
                            fs.mkdir(path.normalize(`${base_path}/${hashId}/${project_dir_name}`), ((err)=>{
                                if(err){
                                    rimraf.sync(path.normalize(`${base_path}/${hashId}`));
                                    res_handler.resFail400(res, "회원가입 실패");
                                }else{
                                    fs.mkdir(path.normalize(`${base_path}/${hashId}/${data_dir_name}`), ((err)=>{
                                        if(err){
                                            rimraf.sync(path.normalize(`${base_path}/${hashId}`));
                                            res_handler.resFail400(res, "회원가입 실패");
                                        }else{
                                            res_handler.resSuccess200(res, "회원가입 성공");
                                        }
                                    }));
                                }
                            }));
                        }
                    }));                
                })
                .catch((err) => {
                    console.log(err);
                    res_handler.resFail500(res, "회원가입 실패");
                })
            }
        })
        .catch((err) => {
            console.log(err);
            res_handler.resFail500(res, "회원가입 실패");
        })
    },

    unregister(req, res){
        const hashId = crypto.createHash(hash).update(req.body.username + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where : {
                username: req.body.username,
                password: hashPassword
            } 
        })
        .then((user) => {
            if(user){
                models.User.destroy({
                    where:{
                        username: req.body.username,
                        password: hashPassword
                    }
                })
                .then(() => {
                    rimraf.sync(`${base_path}/${hashId}`);
                    res_handler.resSuccess200(res, "회원탈퇴 성공");
                })
                .catch(() => {
                    res_handler.resFail400(res, "회원탈퇴 실패");
                })
            }else{
                res_handler.resFail400(res, "아이디 또는 비밀번호를 잘 못 입력하셨습니다.");
            }
        })
        .catch(() => {
            res_handler.resFail500(res, "회원탈퇴 실패");
        })
    },

    login(req, res){
        //로그인
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where: {
                username: req.body.username,
                password: hashPassword,
                email_verification: true
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail400(res, "아이디 또는 비밀번호를 잘 못 입력하셨습니다.");
            } else {
                //Issue : session
                req.session.username = req.body.username;
                res_handler.resSuccess200(res, "로그인 성공");
            }       
        })
        .catch((err) =>{
            res_handler.resFail500(res, "다시 시도해주세요");
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
        res_handler.resSuccess200(res, "로그아웃 성공");
    },

    findID(req, res){
        models.User.findOne({
            where : {
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail400(res, "등록된 이메일이 아닙니다");
            }else{
                let mailOptions = {
                    from: "deepblock.developer@gmail.com",
                    to: req.body.email,
                    subject: "deepblock - 아이디 찾기 결과",
                    text: `${user.dataValues.username}`
                };
                smtpTransport.sendMail(mailOptions, (err, info) => {
                    if(err){
                        res_handler.resFail500(res, "이메일 전송 실패");
                    }else{
                        res_handler.resSuccess200(res, "이메일 전송 성공");
                    }
                    smtpTransport.close();
                });
            }
        })
        .catch((err) => {
            res_handler.resFail500(res, "아이디 찾기 실패");
        })
    },

    findPassword(req, res){
        models.User.findOne({
            where : {
                username : req.body.username,
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail400(res, "등록된 이메일 또는 아이디가 아닙니다");
            }else{
                const original_key = crypto.randomBytes(256).toString('hex');
                const key_start = original_key.substr(100, 16);
                const key_end = original_key.substr(50, 16);
                const hashKey = key_start + key_end;

                models.User.update({
                    password: crypto.createHash(hash).update(hashKey + salt).digest("hex")},{
                    where: {
                        username : user.dataValues.username, 
                        email : user.dataValues.email
                    }
                })
                .then(() => {
                    let mailOptions = {
                        from: "deepblock.developer@gmail.com",
                        to: req.body.email,
                        subject: "deepblock - 비밀번호 찾기 결과", 
                        text: `${hashKey}`
                    };
                    smtpTransport.sendMail(mailOptions, (err, info) => {
                        if(err){
                            res_handler. resFail500(res, "이메일 전송 실패");
                        }else{
                            res_handler.resSuccess200(res, "이메일 전송 성공");
                        }
                        smtpTransport.close();
                    });
                })
                .catch((err) => {
                     res_handler. resFail500(res, "오류");
                }) 
            }
        })
        .catch((err) => {
            res_handler. resFail500(res, "비밀번호 찾기 실패");
        })
    },
    changePassword(req, res){
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
        const original_key = crypto.randomBytes(256).toString('hex');
        const key_start = original_key.substr(100, 16);
        const key_end = original_key.substr(50, 16);
        const hashKey = key_start + key_end;
        const url = `http://localhost:8000/verifyPassword?key=${hashKey}`;

        models.User.findOne({
            where : {
                email: req.body.email,
                password: hashPassword
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail400(res, "등록된 이메일 또는 비밀번호가 아닙니다");
            }else{
                models.User.update({
                    email_verification: false, key_verification: hashKey},{
                    where: { 
                        email : user.dataValues.email
                    }    
                })
                .then(() => {
                    let mailOptions = {
                        from: "deepblock.developer@gmail.com",
                        to: req.body.email,
                        subject: "deepblock - 비밀번호 변경 인증", 
                        html: "<h1>비밀번호 변경을 위해 URL을 클릭해주세요</h1>" + url
                    };
                    smtpTransport.sendMail(mailOptions, (err, info) => {
                        if(err){
                            res_handler. resFail500(res, "이메일 전송 실패");
                        }else{
                            res_handler.resSuccess200(res, "이메일 전송 성공");
                        }
                        smtpTransport.close();
                        });
                    })
                .catch((err) => {
                     res_handler. resFail400(res, "오류");
                }) 
            }
        })       
        .catch((err) => {
            console.log(err);
            res_handler. resFail500(res, "회원 정보 없음");
        })
    }
};
