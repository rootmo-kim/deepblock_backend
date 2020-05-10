
module.exports = {
    /*
        non-blocking respone handler
    */
    //success
    resSuccess200(res, msg){
        res.status(200).json({
            result : "success",
            message : msg
        }); 
    },

    resSuccess201(res, msg){
        res.status(201).json({
            result : "success",
            message : msg
        }); 
    },

    //failed
    resFail400(res, msg){
        res.status(400).json({
            result : "failed",
            message : msg
        }); 
    },

    resFail401(res, msg){
        res.status(401).json({
            result : "failed",
            message : msg
        }); 
    },

    resFail403(res, msg){
        res.status(403).json({
            result : "failed",
            message : msg
        }); 
    },

    resFail404(res, msg){
        res.status(404).json({
            result : "failed",
            message : msg
        }); 
    },

    resFail409(res, msg){
        res.status(409).json({
            result : "failed",
            message : msg
        }); 
    },

    resFail500(res, msg){
        res.status(500).json({
            result : "failed",
            message : msg
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
                result : "success",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResSuccess201(res, msg){
        return new Promise((resolve) => {
            res.status(201).json({
                result : "success",
                message : msg
            });
            resolve(); 
        })
    },

    //failed
    async syncResFail400(res, msg){
        return new Promise((resolve) => {
            res.status(400).json({
                result : "failed",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResFail401(res, msg){
        return new Promise((resolve) => {
            res.status(401).json({
                result : "failed",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResFail403(res, msg){
        return new Promise((resolve) => {
            res.status(403).json({
                result : "failed",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResFail404(res, msg){
        return new Promise((resolve) => {
            res.status(404).json({
                result : "failed",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResFail409(res, msg){
        return new Promise((resolve) => {
            res.status(409).json({
                result : "failed",
                message : msg
            });
            resolve(); 
        })
    },

    async syncResFail500(res, msg){
        return new Promise((resolve) => {
            res.status(500).json({
                result : "failed",
                message : msg
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