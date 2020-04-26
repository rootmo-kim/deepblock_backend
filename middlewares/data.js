var multer = require("multer");

const dataMiddleware = (req, res, next) => {
    //let image_num = req.body.image_num; // array
    let image_num = [1, 1];
    let dir_name = 0;
    let img_name = -1;

    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if(image_num[dir_name] - 1 == img_name){
                dir_name = dir_name + 1;
                img_name = -1;
            }
            console.log(dir_name);
            cb(null, `../uploadTest/${dir_name}/`); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
          //cb(null, 'db/req.query.id/data/req.body.data_name/')
        },
        filename: function (req, file, cb) {
            img_name = img_name + 1;
            console.log(img_name);
            cb(null, `${img_name}.png`);// cb 콜백함수를 통해 전송된 파일 이름 설정
        }
    });

    var upload = multer({storage : storage});
    console.log(upload);
    upload.array('image');

    const p =new Promise(
        (resolve, reject) => {

            resolve();
        }
    )
    p.then(() => {
        console.log("image upload sucess");
        next();
    })
    .catch(function(erros){
        console.log("image upload failde");
        res.status(403).json({
            success : false,
            message : erros
        })
    });
};

module.exports = dataMiddleware;