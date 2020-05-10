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
    var that = this
    var hashed_file;
    file.stream.on('data', function (chunk) {
        hashed_file = crypto.createHash('md5').update(chunk).digest('hex');
        file.stream = null;
        if(hashed_file){
         return cb(null);
        }
    })
    that.getDestination(req, file, function (err, destination) {
        if (err) return cb(err)
        that.getFilename(req, file, function (err, filename) {
            if (err) return cb(err)
            var finalPath = path.join(destination, filename)
            var outStream = fs.createWriteStream(finalPath)

            file.stream.pipe(outStream)
            outStream.on('error', cb)
            outStream.on('finish', function () {
                // models.Attachment.findOne({where : {hash : hashed_file}})
                // .then((result)=> {
                    // if(result){
                    //     fs.unlink(finalPath, ((err) =>{
                    //         if(err) return cb(err)
                    //     }));
                    //     return cb();
                    // }else{
                cb(null, {
                    destination: destination,
                    filename: filename,
                    path: finalPath,
                    size: outStream.bytesWritten,
                    hash: hashed_file
                })
                    //} 
                //})
            })
        })
    })
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