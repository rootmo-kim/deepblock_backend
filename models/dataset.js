'use strict';
module.exports = (sequelize, DataTypes) => {
  const dataset = sequelize.define('dataset', {
    dataset_name: {
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
  dataset.associate = function(models) {
    dataset.hasMany(models.project,{
      foreignKey: 'project_name'
    })

    dataset.belongsTo(models.user,{
      foreignKey: 'user_id'
    })
  };
  return dataset;
};