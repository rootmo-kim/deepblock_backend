const res_handler = require('../utils/responseHandler');

const authenticator = (req, res, next) => {
    const p = new Promise(
        (resolve, reject) => {
            if(req.session.id)
            {
                resolve();
            }else{
                reject();
            }
        }
    )
    p.then(() => {
        console.log("authMiddleware success");
        next();
    })
    .catch(function(eeror) {
        console.log("authMiddleware failed");
        res_handler.resFail401(res, "로그인이 필요합니다");
    });
};

module.exports = authenticator;