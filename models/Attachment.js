'use strict';
module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define('Attachment', {
    hash: {
      unique: true,
      allowNull: false,
      type: DataTypes.STRING
    },
    path: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Attachment.associate = function(models) {
    models.Attachment.hasMany(models.Image,{
      foreignKey: 'fk_attachment_id',
      onDelete: 'cascade',
    })
  };
  return Attachment;
};