
module.exports = {
    /*
        non-blocking respone handler
    */
    //success
    resSuccess200(res, msg){
        res.status(200).json({
            result : "true",
            massage : msg
        }); 
    },

    resSuccess201(res, msg){
        res.status(201).json({
            result : "true",
            massage : msg
        }); 
    },

    //failed
    resFail400(res, msg){
        res.status(400).json({
            result : "false",
            massage : msg
        }); 
    },

    resFail404(res, msg){
        res.status(404).json({
            result : "false",
            massage : msg
        }); 
    },

    resFail500(res, msg){
        res.status(500).json({
            result : "false",
            massage : msg
        }); 
    },

    resCustom(res, status_num, custom_json){
        res.status(status_num).json(custom_json); 
    },

    /*
        async respone handler
    */
    //success
    async syncResSuccess200(res, msg){
        return new Promise((resolve) => {
            res.status(200).json({
                result : "true",
                massage : msg
            });
            resolve(); 
        })
    },

    async syncResSuccess201(res, msg){
        return new Promise((resolve) => {
            res.status(201).json({
                result : "true",
                massage : msg
            });
            resolve(); 
        })
    },

    //failed
    async syncResFail400(res, msg){
        return new Promise((resolve) => {
            res.status(400).json({
                result : "false",
                massage : msg
            });
            resolve(); 
        })
    },

    async syncResFail404(res, msg){
        return new Promise((resolve) => {
            res.status(404).json({
                result : "false",
                massage : msg
            });
            resolve(); 
        })
    },

    async syncResFail500(res, msg){
        return new Promise((resolve) => {
            res.status(500).json({
                result : "false",
                massage : msg
            });
            resolve(); 
        })
    },

    async syncResCustom(res, status_num, custom_json){
        return new Promise((resolve) => {
            res.status(status_num).json(custom_json);
            resolve(); 
        })
    }
}