

module.exports = {
    viewProject(req, res){
        console.log('viewProject');
        console.log(req.query.id);
        res.status(200).send("성공!");
    },

    createProject(req, res){
        console.log('createProject');
    },

    deleteProject(req, res){
        console.log('deleteProject');
    },
    loadProject(req, res){
        console.log('loadProject');
    }
};