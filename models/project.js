'use strict';
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    project_name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    project_path: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Project.associate = function(models) {
    models.Project.hasMany(models.Train,{
      foreignKey: 'fk_project_id',
      onDelete: 'cascade',
    })
    models.Project.hasMany(models.Test,{
      foreignKey: 'fk_project_id',
      onDelete: 'cascade',
    })
  };
  return Project;
};