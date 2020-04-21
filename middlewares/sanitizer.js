

const sanitizer = (req, res, next) => {
    const p = new Promise(
        (resolve, reject) => {
            resolve();
        }
    )
    p.then(() => {
        console.log("sanitizer success");
        next();
    })
    .catch(function(eeror) {
        console.log("sanitizer failed");
            // return res.status(403).json({
            //     success: false,
            //     message: error
            // });
        next();
    });
};

module.exports = sanitizer;