let fs      = require('fs');
let multer  = require("multer");

module.exports = {
    viewData(req, res){
        console.log("viewData");
    },

    uploadData(req ,res){
        //data 업로드
        console.log("uploadData");
        var imgFile = req.files;
        let cnt = 0;
        // for(let img of imgFile){
        //     img.originalname = `${cnt}/${img.originalname}`
            
        // }
        console.log(imgFile);

    },

    deleteData(req, res){
        console.log("deleteData");
    }
};