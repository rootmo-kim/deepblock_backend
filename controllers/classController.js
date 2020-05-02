const crypto = require("crypto");
const fs = require('fs');
const rimraf = require('rimraf');

//const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const data_dir_name = require('../config/configs').datasets;

module.exports = {
    viewClass(req, res){

    },

    createClass(req, res){

    },

    deleteClass(req,res){

    },

    updateClass(req, res){

    }


}