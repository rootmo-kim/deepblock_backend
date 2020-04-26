

module.exports = {
    viewProject(req, res){
        console.log('viewProject');
        res.status(200).send("성공!");
    },

    createProject(req, res){
        console.log('createProject');
        console.log(req.body.project_name);
    },

    deleteProject(req, res){
        console.log('deleteProject');
    },
    loadProject(req, res){
        console.log('loadProject');
    }
};