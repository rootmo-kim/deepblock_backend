'use strict';
module.exports = (sequelize, DataTypes) => {
  const project = sequelize.define('project', {
    project_name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  project.associate = function(models) {
    project.belongsTo(models.user,{
      foreignKey: 'user_id'
    })
  };
  return project;
};