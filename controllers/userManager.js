const crypto = require("crypto");
const models = require("../models");
const salt = "abc";//Math.round((new Date().valueOf() * Math.random())) + "";

module.exports = {
    register(req, res){
        //회원가입 -> 디렉토리 or DB생성 필요
        let hashPassword = crypto.createHash("sha512").update(req.body.password + salt).digest("hex");
        
        models.user.create({
            user_id: req.body.user_id,
            email: req.body.userEmail,
            password: hashPassword
        })
        res.status(200).json({
          success: "회원가입 성공"
        })
        console.log('register');
    },

    async login(req, res){
        //로그인
      let hashPassword = crypto.createHash("sha512").update(req.body.password + salt).digest("hex");

      console.log(req.body.user_id);
      console.log(req.body.password);
      await models.user.findOne({
          where: {
              user_id: req.body.user_id,
              password: hashPassword
          }
      })
      .then(function(user){
          if(!user){
              console.log("비밀번호 불일치");
              res.status(200).json({
                  success: "id or pw does not match"
              })
          } else {
              console.log('user is exist');
              req.session.user_id = req.body.user_id;
              console.log("비밀번호 일치");
              res.clearCookie('sid');
              res.status(200).json({
                success: "로그인 성공"
              })
          }
          
      })
      .catch(function(error){
          console.log("error");
          res.status(500).json(error)
      });
    },

    logout(req, res){
        //로그아웃
        req.session.destroy(function(err){});
        res.clearCookie('sid');
        res.status(200).json({
          success: "로그아웃 성공"
        })
    },

    unregister(req, res){
        console.log('unregister');
    }
};