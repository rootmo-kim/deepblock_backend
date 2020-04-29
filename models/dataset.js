'use strict';
module.exports = (sequelize, DataTypes) => {
  const Dataset = sequelize.define('Dataset', {
    dataset_name: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Dataset.associate = function(models) {
    models.Dataset.hasMany(models.Class,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
    models.Dataset.hasMany(models.Train,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
    models.Dataset.hasMany(models.Test,{
      foreignKey: 'fk_dataset_id',
      onDelete: 'cascade',
    })
  };
  return Dataset;
};