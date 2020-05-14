const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const mkdirp = require('mkdirp')

const models = require("../models");

function getFilename (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
        cb(err, err ? undefined : raw.toString('hex'))
    })
}

function getDestination (req, file, cb) {
    cb(null, os.tmpdir())
}

function MyCustomStorage (opts) {
    this.getFilename = (opts.filename || getFilename)
    
    if (typeof opts.destination === 'string') {
        mkdirp.sync(opts.destination)
        this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
    } else {
        this.getDestination = (opts.destination || getDestination)
    }
}

MyCustomStorage.prototype._handleFile = async function _handleFile (req, file, cb) {
    let that = this
    let hashed_file;

    //정상작동 코드
    file.stream.on('data', ((chunk)=>{
        hashed_file = crypto.createHash('sha1').update(chunk).digest('hex');
    }));
    that.getDestination(req, file, async function (err, destination) {
        if (err) return cb(err)
        that.getFilename(req, file, async function (err, filename) {
            if (err) return cb(err)
            //let file_hash = await models.Attachment.findOne({where : {hash : hashed_file}});

            var finalPath = path.join(destination, filename)
            var outStream = fs.createWriteStream(finalPath)

            await file.stream.pipe(outStream)
            outStream.on('error', cb)
            outStream.on('finish', function () {
                cb(null, {
                    destination: destination,
                    filename: filename,
                    path: finalPath,
                    size: outStream.bytesWritten,
                    hash: hashed_file
                })
            })
        })
    })

    // //작동안되는 코드
    // await file.stream.on('data', ((chunk)=>{
    //     hashed_file = crypto.createHash('sha1').update(chunk).digest('hex');
    // }));
    // that.getDestination(req, file, async function (err, destination) {
    //     if (err) return cb(err)
    //     that.getFilename(req, file, async function (err, filename) {
    //         if (err) return cb(err)
    //         let file_hash = await models.Attachment.findOne({where : {hash : hashed_file}});

    //         if(!file_hash){
    //             var finalPath = path.join(destination, filename)
    //             var outStream = fs.createWriteStream(finalPath)
    
    //             await file.stream.pipe(outStream)
    //             outStream.on('error', cb)
    //             outStream.on('finish', function () {
    //                 cb(null, {
    //                     destination: destination,
    //                     filename: filename,
    //                     path: finalPath,
    //                     size: outStream.bytesWritten,
    //                     hash: hashed_file
    //                 })
    //             })
    //         }else{
    //             cb();
    //         }
    //     })
    // })
}

MyCustomStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new MyCustomStorage(opts)
}