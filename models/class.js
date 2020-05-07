'use strict';
module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    class_name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    image_num: {
      allowNull: false,
      type: DataTypes.STRING
    },
    class_path: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Class.associate = function(models){
    models.Class.hasMany(models.Image,{
      foreignKey: 'fk_class_id',
      onDelete: 'cascade',
    })
  }
  return Class;
};