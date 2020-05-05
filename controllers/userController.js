const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const project_dir_name = require('../config/configs').projects;
const data_dir_name = require('../config/configs').datasets;
const res_handler = require('./responeHandler');

const nodemailer = require('nodemailer');
const smtpTransporter = require('nodemailer-smtp-transport');

let smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: "gmail",
    auth: {
        user: "deepblock.developer@gmail.com",
        pass: "1q2w3e4r1!"
    }
}));

module.exports = {
    register(req, res){
        // [Comment] 입력 받는 user_id 와 password 값 express-validator로 검증할 것
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
        const key_one = crypto.randomBytes(256).toString('hex').substr(100, 16);
        const key_two = crypto.randomBytes(256).toString('base64').substr(50, 16);
        const hashKey = key_one + key_two;
        const url = `http://localhost:8000/verifyEmail?key=${hashKey}`;

        models.User.findOne({
            where : {
                user_name: req.body.user_name
            } 
        })
        .then((user)=>{
            if(user){
                res_handler.res_failed_500(res, "중복된 아이디 입니다");
            }else{
               models.User.create({
                    user_name: req.body.user_name,
                    email: req.body.email,
                    password: hashPassword,
                    key_verification: hashKey
                })
                .then(() => {
                    fs.mkdir(path.normalize(`${base_path}/${hashId}`), ((err) => {
                        if(err){
                            if(err){
                                res_handler.res_failed_500(res, "회원가입 실패");
                            }
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
                                    console.log("Email sent: " + info.response);
                                }
                                smtpTransport.close();
                            });
                            fs.mkdir(path.normalize(`${base_path}/${hashId}/${project_dir_name}`), ((err)=>{
                                if(err){
                                    rimraf.sync(path.normalize(`${base_path}/${hashId}`));
                                    res_handler.res_failed_500(res, "회원가입 실패");
                                }else{
                                    fs.mkdir(path.normalize(`${base_path}/${hashId}/${data_dir_name}`), ((err)=>{
                                        if(err){
                                            rimraf.sync(path.normalize(`${base_path}/${hashId}`));
                                            res_handler.res_failed_500(res, "회원가입 실패");
                                        }else{
                                            res_handler.res_success_200(res, "회원가입 성공");
                                        }
                                    }));
                                }
                            }));
                        }
                    }));                
                })
                .catch((error) => {
                    console.log(error);
                    res_handler.res_failed_500(res, "회원가입 실패");
                })
            }
        })
        .catch((err) => {
            console.log(err);
            res_handler.res_failed_500(res, "회원가입 실패");
        })
    },

    unregister(req, res){
        const hashId = crypto.createHash(hash).update(req.body.user_name + salt).digest("hex");
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where : {
                user_name: req.body.user_name,
                password: hashPassword
            } 
        })
        .then((user) => {
            if(user){
                models.User.destroy({
                    where:{
                        user_name: req.body.user_name,
                        password: hashPassword
                    }
                })
                .then(() => {
                    rimraf.sync(`${base_path}/${hashId}`);
                    res_handler.res_success_200(res, "회원탈퇴 성공");
                })
                .catch(() => {
                    res_handler.res_failed_500(res, "회원탈퇴 실패");
                })
            }else{
                res_handler.res_failed_500(res, "아이디 또는 비밀번호를 잘 못 입력하셨습니다.");
            }
        })
        .catch(() => {
            res_handler.res_failed_500(res, "회원탈퇴 실패");
        })
    },

    login(req, res){
        //로그인
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.User.findOne({
            where: {
                user_name: req.body.user_name,
                password: hashPassword,
                email_verification: true
            }
        })
        .then((user) => {
            if(!user){
                res_handler.res_failed_500(res, "아이디 또는 비밀번호를 잘 못 입력하셨습니다.");
            } else {
                //Issue : session
                req.session.user_name = req.body.user_name;
                res_handler.res_success_200(res, "로그인 성공");
            }       
        })
        .catch((err) =>{
            res_handler.res_failed_500(res, "다시 시도해주세요");
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
        res_handler.res_success_200(res, "로그아웃 성공");
    },

    findID(req, res){
        models.User.findOne({
            where : {
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.res_failed_500(res, "등록된 이메일이 아닙니다");
            }else{
                let mailOptions = {
                    from: "deepblock.developer@gmail.com",
                    to: req.body.email,
                    subject: "deepblock - 아이디 찾기 결과",
                    text: `${user.dataValues.user_name}`
                };
                smtpTransport.sendMail(mailOptions, (err, info) => {
                    if(err){
                        res_handler.res_failed_500(res, "이메일 전송 실패");
                    }else{
                        res_handler.res_success_200(res, "이메일 전송 성공");
                    }
                    smtpTransport.close();
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res_handler.res_failed_500(res, "아이디 찾기 실패");
        })
    },

    findPassword(req, res){
        models.User.findOne({
            where : {
                user_name : req.body.user_name,
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.res_failed_400(res, "등록된 이메일 또는 아이디가 아닙니다");
            }else{
                const pw_one = crypto.randomBytes(256).toString('hex').substr(100, 16);
                const pw_two = crypto.randomBytes(256).toString('base64').substr(50, 16);
                const new_pw = pw_one + pw_two;

                models.User.update({
                    password: crypto.createHash(hash).update(new_pw + salt).digest("hex")},{
                    where: {
                        user_name : user.dataValues.user_name, 
                        email : user.dataValues.email
                    }
                })
                .then(() => {
                    let mailOptions = {
                        from: "deepblock.developer@gmail.com",
                        to: req.body.email,
                        subject: "deepblock - 비밀번호 찾기 결과", 
                        text: `${new_pw}`
                    };
                    smtpTransport.sendMail(mailOptions, (err, info) => {
                        if(err){
                            res_handler.res_failed_500(res, "이메일 전송 실패");
                        }else{
                            res_handler.res_success_200(res, "이메일 전송 성공");
                        }
                        smtpTransport.close();
                    });
                })
                .catch((err) => {
                     res_handler.res_failed_500(res, "오류");
                }) 
            }
        })
        .catch((err) => {
            console.log(err);
            res_handler.res_failed_500(res, "비밀번호 찾기 실패");
        })
    },
    changePassword(req, res){
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
        const key_one = crypto.randomBytes(256).toString('hex').substr(100, 16);
        const key_two = crypto.randomBytes(256).toString('base64').substr(50, 16);
        const hashKey = key_one + key_two;
        const url = `http://localhost:8000/verifyPassword?key=${hashKey}`;

        models.User.findOne({
            where : {
                email: req.body.email,
                password: hashPassword
            }
        })
        .then((user) => {
            if(!use){
                res_handler.res_failed_400(res, "등록된 이메일 또는 비밀번호가 아닙니다");
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
                        subject: "deepblock -  비밀번호 변경 인증", 
                        html: "<h1>비밀번호 변경을 위해 URL을 클릭해주세요</h1>" + url
                    };
                    smtpTransport.sendMail(mailOptions, (err, info) => {
                        if(err){
                            res_handler.res_failed_500(res, "이메일 전송 실패");
                        }else{
                            res_handler.res_success_200(res, "이메일 전송 성공");
                        }
                        smtpTransport.close();
                        });
                    })
                .catch((err) => {
                     res_handler.res_failed_500(res, "오류");
                }) 
            }
        })       
        .catch((err) => {
            console.log(err);
            res_handler.res_failed_500(res, "회원 정보 없음");
        })
    }
};
