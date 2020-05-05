const crypto = require("crypto");
const models = require("../models");
const salt = require('../config/configs').salt;
const hash = require('../config/configs').hash;
const res_handler = require('../controllers/responeHandler');

module.exports = {
    verifyEmail(req, res){
        models.User.update({email_verification: true}, {where: {key_verification: req.query.key}})
        .then((user) => {
            if(!user[0]){
                res_handler.resFail500(res, "인증키 오류");
            }else{
                res_handler.resSuccess200(res, "인증 성공 - 로그인 가능!");
            }
        })
        .catch((err) => {
            res_handler.resFail500(res, "오류");
        })
    },

    verifyPassword(req, res){
        const hashPassword = crypto.createHash(hash).update(req.body.password + salt).digest("hex");
        models.User.update({password: hashPassword}, {where: {key_verification: req.query.key}})
        .then((user) => {
            if(!user){
                res_handler.resFail500(res, "인증키 오류");
            }else{
                res_handler.resSuccess200(res, "인증 성공 - 비밀번호 변경 완료!");
            }
        })
        .catch((err) => {
            res_handler.resFail500(res, "오류");
        })
    }
}