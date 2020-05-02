let PImage      = require('pureimage');
let tf          = require("@tensorflow/tfjs-node");
let fs          = require('fs');
let path        = require("path");

let _imgPath;
let width;
let height;
let dim;

exports.dataInit = async function (path, imgType, shape){
    _imgPath = await getImgPath(path, imgType);
    width = shape[0];
    height = shape[1];
    dim = shape[2];
    return _imgPath;
};

exports.imageGenerator = async function*() {
    //console.log(_imgPath.length);
    for (let i = 0; i < _imgPath.length; i++) {
        const img = await loadImage(_imgPath[i]);
        //console.log(getType(img));
        const tens = await tf.browser.fromPixels(img)
            .resizeNearestNeighbor([width, height])
            .div(255.0);
        yield tens;
    }
};

exports.labelGenerator = async function*() {
    const labels = _imgPath.map(path => {
        const labelSplit = path.split("\\");
        const label = labelSplit[labelSplit.length - 2];
        //console.log("label : " + label);
        return label;
    });

    const uniq = labels.reduce(function (a, b) {
        if (a.indexOf(b) < 0) a.push(b);
        return a;
    }, []);

    for (let j = 0; j < labels.length; j++) {
        for (let i = 0; i < uniq.length; i++) {
            if(labels[j] == uniq[i]){
                const lbl = await tf.oneHot(i, uniq.length);
                //console.log("lbl : " + lbl);
                yield lbl;
            }
        }
    }
};

function getImgPath(startPath, fileExt) {
    const dirName = fs.readdirSync(startPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    const imgPath = [];
    dirName.forEach(name => {
        const filePath = path.join(startPath, name);
        const fileName = fs.readdirSync(filePath).filter((file) => file.endsWith(fileExt));
        fileName.forEach(file => {
            const fullPath = path.join(startPath, name, file);
            imgPath.push(fullPath);
        });
    });
    return imgPath;
}

function loadImage(imgPath){
    let img;
    if(imgPath.split('.').pop() == 'jpg'){
        img = PImage.decodeJPEGFromStream(fs.createReadStream(imgPath));
    }
    else if(imgPath.split('.').pop() == 'png'){
        img = PImage.decodePNGFromStream(fs.createReadStream(imgPath));
    }
    else{
        console.log('Input image is not supported format. Use jpg or png.');
    }
    return img;
}

function getType(target) {
    return Object.prototype.toString.call(target);
}

