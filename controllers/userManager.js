const crypto = require("crypto");
const models = require("../models");
const salt = "s34i0mas21";
var fs = require('fs');

//디렉토리 경로 나중에 서버로 바꿀꺼여~
module.exports = {
    register(req, res){
        const hashPassword = crypto.createHash("sha256").update(req.body.password + salt).digest("hex");
        const hashId = crypto.createHash("sha256").update(req.body.user_id + salt).digest("hex");

        models.user.create({
            user_id: req.body.user_id,
            email: req.body.email,
            password: hashPassword
        })
        .then((user) => {
            //개인 디렉토리 생성(디렉토리 존재 여부)
            fs.access(`C:/Users/rootm/Desktop/MySQL_DB/${hashId}`, fs.constants.F_OK, (err)=>{
                if(err){
                    if(err.code === 'ENOENT'){
                        console.log('해당 디렉토리 없음');
                        fs.mkdir(`C:/Users/rootm/Desktop/MySQL_DB/${hashId}`,function(err){
                            if(err){
                                throw err;
                            }
                            console.log('디렉토리 생성');     
                        })
                    }
                }
            })
            res.status(200).json({
                message: "회원가입 성공"
            })
        })
        .catch((error) => {
            res.status(500).json({
                message: "회원가입 실패(해당 아이디가 이미 존재)"
            })
        })
    },

    unregister(req, res){
        const hashId = crypto.createHash("sha256").update(req.body.user_id + salt).digest("hex");

        models.user.destroy({
            where:{
                user_id: req.body.user_id,
            }
        })
        .then((user) => {
            fs.readdir(`C:/Users/rootm/Desktop/MySQL_DB/${hashId}`, (err,dir) =>{
                if(err){
                    throw err;
                }
                console.log('디렉토리 내용 확인', dir);
    
                fs.rmdir(`C:/Users/rootm/Desktop/MySQL_DB/${hashId}`, (err) =>{
                    if(err){
                        throw err;
                    }
                    res.status(200).json({
                        message: "회원탈퇴 성공"
                    })
                })
            })
        })
        .catch((error) => {
            res.status(500).json({
                message: "회원탈퇴 실패(정보가 틀림)"
            })
        })
    },

    async login(req, res){
        //로그인
        let hashPassword = crypto.createHash("sha256").update(req.body.password + salt).digest("hex");

        await models.user.findOne({
            where: {
                user_id: req.body.user_id,
                password: hashPassword
            }
        })
        .then((user) => {
            if(!user){
                res.status(200).json({
                    message: "아이디 또는 비밀번호가 틀림"
                })
            } else {
                req.session.user_id = req.body.user_id;
                res.clearCookie('sid');
                res.status(200).json({
                    message: "로그인 성공"
                })
            }
            
        })
        .catch((error) =>{
            res.status(500).json(error)
        });
    },

    logout(req, res){
        //로그아웃
        req.session.destroy((err) => {
            req.session;
        });
        res.clearCookie('sid');
        res.status(200).json({
          message: "로그아웃 성공"
        });
    },
};