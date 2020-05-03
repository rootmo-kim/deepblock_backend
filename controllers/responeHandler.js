
module.exports = {
    //success
    res_success_200(res, msg){
        res.status(200).json({
            result : "true",
            massage : msg
        })  ; 
    },

    res_success_201(res, msg){
        res.status(201).json({
            result : "true",
            massage : msg
        })  ; 
    },

    //failed
    res_failed_400(res, msg){
        res.status(400).json({
            result : "false",
            massage : msg
        })  ; 
    },

    res_failed_404(res, msg){
        res.status(404).json({
            result : "false",
            massage : msg
        })  ; 
    },

    res_failed_500(res, msg){
        res.status(500).json({
            result : "false",
            massage : msg
        })  ; 
    },

    res_custom(res, status_num, result_bool, msg){
        res.status(status_num).json({
            result : result_bool,
            massage : msg
        })  ; 
    }
}