let fs      = require('fs');
let multer  = require("multer");

module.exports = {
    viewDataset(req, res){
        console.log("viewData");
    },

    addDataset(req, res){

    },

    uploadImage(req ,res){
        //data 업로드
        console.log("uploadData");
        var imgFile = req.files;
        console.log(imgFile);

    },

    deleteDataset(req, res){
        console.log("deleteData");
    }
};