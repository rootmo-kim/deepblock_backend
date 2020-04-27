const crypto = require("crypto");
const models = require("../models");
const salt = "s34i0mas21";
// [Comment] var 최대한 쓰지 말고 const, let 사용 권장
var fs = require('fs');

//디렉토리 경로 나중에 서버로 바꿀꺼여~
module.exports = {
    register(req, res){
        // [Comment] 입력 받는 user_id 와 password 값 express-validator로 검증할 것
        const hashPassword = crypto.createHash("sha256").update(req.body.password + salt).digest("hex");
        const hashId = crypto.createHash("sha256").update(req.body.user_id + salt).digest("hex");

        models.user.create({
            user_id: req.body.user_id,
            email: req.body.email,
            password: hashPassword
        })
        // [Comment] Indentation 신경 쓸 것
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
        // [Comment] async 써준 이유 ?
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
            // [Comment] 에러 핸들링 해주기, 이런 식으로 서버에서 발생한 err 자체를 사용자에게 던져주면 위험함.
            // ex) console.log(error); res.status(500).json({msg:"login failed"})
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
        // [Comment] TODO: 로그아웃 후 main 화면으로 redirect 시킬 것 
        // ex) res.redirect('/') 
    },
};
