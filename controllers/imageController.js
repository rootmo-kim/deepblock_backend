'use strict';

const crypto = require("crypto");
const fs = require('fs');
const fsp = require('fs').promises;
const rimraf = require('rimraf');
const gm = require("gm");
const sharp = require('sharp');

const models = require("../models");
const salt = require('../config/configs').salt;
const base_path = require('../config/configs').base_path;
const hash = require('../config/configs').hash;
const dataset_dir_name = require('../config/configs').datasets;
const responseHandler = require('../utils/responseHandler');

module.exports = {
    sendClassImage(req, res) {
        let offset = (parseInt(req.query.page) * 10);
        let limit = parseInt(req.query.limit);

        models.Image.findAll({
            limit: limit,
            offset: offset,
            where: {
                classID: req.params.class_id,
            },
            order: [['id', 'asc']]
        })
        .then(async function(images){
            for(let image of images){
                let data = await fsp.readFileSync(image.dataValues.thumbnailPath);
            }
            responseHandler.custom(res, 200, {
                image_list : images
            })
        })
        .catch((err) => {
            responseHandler.fail(res, 500, '처리 실패');
        })
    },

    uploadImage(req, res) {
        let files = req.files;
        let class_id = req.params.class_id;

        let resize_promise_liSst = [];
        let sequelize_promise_list = [];
        let original_file_path = null;
        let thumbnail_file_path = null;

        for (var file of files) {
            original_file_path = file.path;
            thumbnail_file_path = `${req.thumbnail_path}/${file.filename}`;

            resize_promise_list.push(new Promise(function () {
                sharp(original_file_path).resize({ height: 14, width: 14 }).toFile(thumbnail_file_path);
            }))

            sequelize_promise_list.push(new Promise(function () {
                models.Image.create({
                    classID: class_id,
                    originalPath: original_file_path,
                    thumbnailPath: thumbnail_file_path
                })
            }))
        }

        Promise.all(resize_promise_list)
        Promise.all(sequelize_promise_list)
        responseHandler.success(res, 200, "업로드 성공");
    },

    deleteImage(req, res) {

    },
}