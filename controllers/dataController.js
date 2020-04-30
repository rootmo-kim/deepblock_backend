let fs      = require('fs');

const salt = require('../config/config').salt;
const base_path = require('../config/config').base_path;
const hash = require('../config/config').hash;
const project_dir_name = req('../config/config').projects;
const data_dir_name = req('../config/config').datasets;

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