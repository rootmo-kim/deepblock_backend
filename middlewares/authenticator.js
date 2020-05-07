

const authMiddleware = (req, res, next) => {
    const p = new Promise(
        (resolve, reject) => {
            resolve();
        }
    )
    p.then(() => {
        console.log("authMiddleware success");
        next();
    })
    .catch(function(eeror) {
        console.log("authMiddleware failed");
            // return res.status(403).json({
            //     success: false,
            //     message: error
            // });
        next();
    });
};

module.exports = authMiddleware;