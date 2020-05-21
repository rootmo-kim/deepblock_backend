const sequelize = require('../models').sequelize;
const models = require('../models');
const cryto
// Init DB squelizer
sequelize.sync().then(() => {
    models.User.create({
        id : 9999,
        username : "tester",
        password : 
    }).then((users)=>{
        console.log(users);
    })
});

