'use strict';
module.exports = (sequelize, DataTypes) => {
  const Dataset = sequelize.define('Dataset', {
    datasetName: {
      allowNull: false,
      type: DataTypes.STRING
    },
  }, {});
  Dataset.associate = function(models) {
    models.Dataset.hasMany(models.Classes,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
    models.Dataset.hasMany(models.Trains,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
    models.Dataset.hasMany(models.Tests,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
  };
  return Dataset;
};