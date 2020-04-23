'use strict';
module.exports = (sequelize, DataTypes) => {
  const project = sequelize.define('project', {
    project_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  project.associate = function(models) {
    // associations can be defined here
  };
  return project;
};