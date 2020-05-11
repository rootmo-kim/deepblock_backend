'use strict';
module.exports = (sequelize, DataTypes) => {
  const Projects = sequelize.define('Projects', {
    projectsName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    projectsPath: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Projects.associate = function(models) {
    models.Projects.hasMany(models.Trains,{
      foreignKey: 'fk_Projects_id',
      onDelete: 'cascade',
    })
    models.Projects.hasMany(models.Tests,{
      foreignKey: 'fk_Projects_id',
      onDelete: 'cascade',
    })
  };
  return Projects;
};