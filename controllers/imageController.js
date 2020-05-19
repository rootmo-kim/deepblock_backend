'use strict';

const fsp = require('fs').promises;
const sharp = require('sharp');
const datauri = require('datauri');

const models = require("../models");
const responseHandler = require('../utils/responseHandler');

module.exports = {
    sendClassImage(req, res) {
        //TODO : 예외처리, db질의 안정성 증가
        let offset = (parseInt(req.query.page) * 10);
        let limit = parseInt(req.query.limit);

        models.Image.findAll({
            limit: limit,
            offset: offset,
            where: {
                classID : req.params.class_id,
            },
            order: [['id', 'asc']]
        })
        .then(async function(images){
            let image_list = [];
            for(let image of images){
                let image_uri = await datauri(image.dataValues.thumbnailPath);
                image_list.push({image_id : image.dataValues.id, image_uri : image_uri});
            }
            responseHandler.custom(res, 200, {
                image_list : image_list
            })
        })
        .catch(() => {
            responseHandler.fail(res, 500, '처리 실패');
        })
    },

    uploadImage(req, res) {
        //TODO : 예외처리
        let files = req.files;
        let class_id = req.params.class_id;

        let promise_list = [];
        let original_file_path = null;
        let thumbnail_file_path = null;

        for (var file of files) {
            original_file_path = file.path;
            thumbnail_file_path = `${req.thumbnail_path}/${file.filename}`;

            promise_list.push(
                //TODO : 예외처리 어떻게 할지 고민중
                models.Image.create({
                    classID: class_id,
                    originalPath: original_file_path,
                    thumbnailPath: thumbnail_file_path
                }).then((result)=>{
                    //create thumbnail image
                    sharp(result.dataValues.originalPath).resize({ height: 14, width: 14 }).toFile(result.dataValues.thumbnailPath)
                    .then(()=>{})
                    .catch((err)=>{
                        //TODO
                    });
                })
                .catch(()=>{
                    //TODO
                })
            )
        }
        Promise.all(promise_list)
        responseHandler.success(res, 200, "업로드 성공");
    },

    async deleteImage(req, res) {
        //TODO : 예외처리
        const class_id = req.params.class_id;

        try{
            let target = await models.Class.findOne({
                include : [{
                    model : models.Image,
                    where : {
                        id : req.params.image_id
                    }
                }],
                where :{
                    id : class_id
                }
            })
    
            if(target){
                let target_image = target.dataValues.Images[0].dataValues;
                await models.Image.destroy({where : { classID : class_id, id : target_image.id}});
    
                fsp.unlink(target_image.thumbnailPath);
                fsp.unlink(target_image.originalPath);
                responseHandler.success(res, 200, '삭제 성공');
            }else{
                responseHandler.fail(res, 403, '잘못 된 접근');
            }
        }catch(err){
            responseHandler.fail(res, 500, '처리 실패');
        }

    },

    sendOrigianlImage(req, res){

    }
}