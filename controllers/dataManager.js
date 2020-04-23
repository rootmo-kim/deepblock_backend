module.exports = {
    viewData(req, res){
        console.log("viewData");
    },

    uploadData(req, file ,res){
        //data 업로드
        console.log("uploadData");
    },

    deleteData(req, res){
        console.log("deleteData");
    }
};