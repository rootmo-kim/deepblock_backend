'use strict';
module.exports = (sequelize, DataTypes) => {
  const Classes = sequelize.define('Classes', {
    className: {
      allowNull: false,
      type: DataTypes.STRING
    },
    imageCount: {
      allowNull: false,
      type: DataTypes.STRING
    },
    classPath: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Classes.associate = function(models){
    models.Classes.hasMany(models.Attaches,{
      foreignKey: 'fk_classes_id',
      onDelete: 'cascade',
    })
  }
  return Classes;
};