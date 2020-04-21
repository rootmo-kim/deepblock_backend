

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
            console.log('bye');
            return false;
        }
    }

    const p = new Promise(
        (resolve, reject) => {
            // for(var _model of proj.models){
            //     if(proj.data.type == "img"){
            //         for(var i=0 ; i<proj.data.info.shape.length; i++){
            //             if(proj.data.info.shape[i] != _model.layers[0].params.inputShape[i]){
            //                 console.log(`data size error`)
            //                 reject(`data size error`);
            //             }
            //         }
            //     }else{
            //         if(proj.data.info.total_column != _model.layers[0].params.units){
            //             console.log('data size error');
            //             reject(`data size error`);
            //         }
            //     }

            //     if(_models.total_layer - 1 != _model.link_info.total_link){
            //         console.log('connection error');
            //         reject(`connection error`);
            //     }

            //     if(_model.layer[_model.layers.length-1].type != "dense"){
            //         console.log('final layer error');
            //         reject('final layer error');
            //     }
            // }
            console.log('success');
            resolve();
        }
    )
    p.then(() => {
        console.log("test success");
        next();
    })
    .catch(function(eeror) {
        console.log(error);
            // return res.status(403).json({
            //     success: false,
            //     message: error
            // });
    });
};

module.exports = modelMiddleware;