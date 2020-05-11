const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
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
const admin_email = require('../config/configs').admin_email;
const admin_password = require('../config/configs').admin_password;
const admin_email_service = require('../config/configs').admin_email_service;
const server_ip = require('../config/configs').server_ip;
const res_handler = require('../utils/responseHandler');

// let redis = require('redis');
// var redis_client = redis.createClient(6379, 'localhost');


smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: admin_email_service,
    auth: {
        user: admin_email,
        pass: admin_password
    }
}));

module.exports = {
    async register(req, res){
        let user_path;
        let transaction;

        try{
            transaction = await models.sequelize.transaction();

            let user_check = [];
            user_check.push(await models.Users.findOne({where : {username : req.body.username}}));
            user_check.push(await models.Users.findOne({where : {email : req.body.email}}));

            if(user_check[0] && user_check[1]){
                res_handler.resFail401(res, "중복된 아이디 이메일 입니다");
            }else if(user_check[0]){
                res_handler.resFail401(res, "중복된 아이디 입니다");
            }else if(user_check[1]){
                res_handler.resFail401(res, "중복된 이메일 입니다");
            }else{
                const hashId = crypto.createHash(hash).update(req.body.username + salt).digest("hex");
                const hash_password = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
                const original_key = crypto.randomBytes(256).toString('hex');
                const hash_key = original_key.substr(100, 16)+original_key.substr(50, 16);
                await models.Users.create({
                    username: req.body.username,
                    email: req.body.email,
                    password: hash_password,
                    verifyKey: hash_key
                }, {
                    transaction
                });

                user_path = `${base_path}/${hashId}`;

                fs.mkdirSync(user_path);
                fsp.mkdir(`${user_path}/${project_dir_name}`);
                fsp.mkdir(`${user_path}/${data_dir_name}`);

                const url = "<a href='http://" + `${server_ip}` + "/verifyEmail?key=" + `${hash_key}`+ "'>verify</a>"        
                const mailOptions = {
                    from: admin_email,
                    to: req.body.email,
                    subject: "deepblock - 이메일 인증을 해주세요",
                    html: "<h1>이메일 인증을 위해 URL을 클릭해주세요</h1>" + url
                };
                smtpTransport.sendMail(mailOptions, (e, info)=>{
                    if(!e){
                        smtpTransport.close(); 
                    }
                })
                transaction.commit();
                res_handler.resSuccess200(res, "회원가입 성공 이메일 인증을 해주세요");
            }
        }catch(err){
            //console.log(err);
            if(user_path){
                fs.access(user_path, fs.constants.F_OK, ((e)=>{
                    if(!e){
                        rimraf.sync(user_path);
                    }
                }));
            }
            transaction.rollback();
            res_handler.resFail500(res, "처리 실패");
        }
    },

    async unregister(req, res){
        try{
            const hashId = crypto.createHash(hash).update(req.body.username + salt).digest("hex");
            const hash_password = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

            let user = await models.Users.findOne({where : {username : req.session.username, password : hash_password}});

            transaction = await models.sequelize.transaction();

            if(!user){
                transaction.rollback();
                res_handler.resFail401(res, "비밀번호 오류");
            }else{
                await models.Users.destroy({
                    where : {
                        username : req.session.username,
                        password : hash_password
                    }
                },{
                    transaction
                });

                rimraf.sync(`${base_path}/${hashId}`);
                await transaction.commit();
                await res_handler.syncResSuccess200(res, "회원탈퇴 성공");
            }
        }catch(err){
            transaction.rollback();
            res_handler.syncResFail500(res, "처리 실패");
        }
    },

    login(req, res){
        //로그인
        const hash_password = crypto.createHash(hash).update(req.body.password + salt).digest("hex");

        models.Users.findOne({
            where: {
                username: req.body.username,
                password: hash_password
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail401(res, "아이디 비밀번호 오류");
            }else if(user.dataValues.isVerify === false){
                res_handler.resFail403(res, "이메일 인증필요");
            }else{
                req.session.userID = user.dataValues.userID;
                req.session.username = user.dataValues.username;
                res_handler.resSuccess200(res, "로그인 성공");
            }       
        })
        .catch((err) =>{
            res_handler.resFail500(res, "처리 실패");
        });
    },

    logout(req, res){
        req.session.destroy((err) => {
            if(err){
                res_handler.resFail401(res, "로그아웃 실패");
            }else{
                res.clearCookie('sid');
                res_handler.resSuccess200(res, "로그아웃 성공");
            }
        });
    },

    findID(req, res){
        models.Users.findOne({
            where : {
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail401(res, "등록되지 않은 사용자 입니다");
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
            res_handler.resFail401(res, "등록되지 않은 사용자 입니다");
        })
    },

    findPassword(req, res){
        models.Users.findOne({
            where : {
                username : req.body.username,
                email : req.body.email
            }
        })
        .then((user) => {
            if(!user){
                res_handler.resFail401(res, "등록되지 않은 사용자 입니다");
            }else{
                const original_key = crypto.randomBytes(256).toString('hex');
                const key_start = original_key.substr(100, 16);
                const key_end = original_key.substr(50, 16);
                const hash_key = key_start + key_end;

                models.Users.update({
                    password: crypto.createHash(hash).update(hash_key + salt).digest("hex")},{
                    where: {
                        username : user.dataValues.username, 
                        email : user.dataValues.email
                    }
                })
                .then(() => {
                    let mailOptions = {
                        from: "deepblock.developer@gmail.com",
                        to: req.body.email,
                        subject: "deepblock - 임시 비밀번호", 
                        text: `${hash_key}`
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
                     res_handler. resFail401(res, "등록되지 않은 사용자 입니다");
                }) 
            }
        })
        .catch((err) => {
            res_handler. resFail401(res, "등록되지 않은 사용자입니다");
        })
    },
    viewUserProfile(req, res){

    },
    
    changeAvatar(req, res){

    },

    changePassword(req, res){
        const before_password = req.body.before_password;
        const after_password = req.body.after_password;
        const before_hash_password = crypto.createHash(hash).update(before_password + salt).digest("hex");
        const after_hash_password = crypto.createHash(hash).update(after_password + salt).digest("hex");
        const after_password_verify = req.body.after_password_verify;
    
        if(after_password !== after_password_verify){
            res_handler.resFail401(res, "비밀번호가 잘못되었습니다");
        }else{
            models.Users.update({
                password : after_hash_password},{
                    where : {
                        userID : req.session.userID,
                        password : before_hash_password
                    }   
                })
                .then((user) => {
                    res_handler.resSuccess200(res, "비밀번호 변경 완료");
                })
                .catch((err) => {
                    res_handler. resFail401(res, "비밀번호가 잘못되었습니다");
                })
            }          
    },
    verifyEmail(req, res){
        models.Users.update({isVerify: true}, {where: {verifyKey: req.query.key}})
        .then((user) => {
            if(!user[0]){
                res_handler.resFail401(res, "인증키 오류");
            }else{
                res_handler.resSuccess200(res, "인증 성공 - 로그인 가능!");
            }
        })
        .catch((err) => { 
            res_handler.resFail401(res, "인증키 오류");
        })
    },
};
