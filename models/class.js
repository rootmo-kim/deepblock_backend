'use strict';
module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
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
  Class.associate = function(models){
    models.Class.hasMany(models.Attach,{
      foreignKey: 'classID',
      onDelete: 'cascade',
    })
  }
  return Class;
};