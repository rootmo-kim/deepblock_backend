

const modelMiddleware = (req, res, next) => {
    //data size checking
    //none connected layer
    //none param
    let proj    = require("../public/json/model_info.json"); // req.model_info;
    for (var _model of proj.models){
        if(_model.layers == null){
            // return res.status(403).json({
            //     success: false,
            //     message: 'layers are null'
            // })
            return false;
        }
    }

    const p = new Promise(
        (resolve, reject) => {
            for(var _model of proj.models){
                if(proj.data.type == "img"){
                    for(var i=0 ; i<proj.data.info.shape.length; i++){
                        if(proj.data.info.shape[i] != _model.layers[0].params.inputShape[i]){
                            reject(`data size error`);
                        }
                    }
                }else{
                    if(proj.data.info.total_column != _model.layers[0].params.units){
                        reject(`data size error`);
                    }
                }

                if(_models.total_layer - 1 != _model.link_info.total_link){
                    reject(`connection error`);
                }
                
                if(_model.layer[_model.layers.length-1].type != "dense"){
                    reject('final layer error');
                }
            }
            resolve();
        }
    )
    p.then(() => {
        console.log("test success");
        next();
    })
    .catch(function(eeror) {
        console.log("test failed");
            // return res.status(403).json({
            //     success: false,
            //     message: error
            // });
    });
};

module.exports = modelMiddleware;