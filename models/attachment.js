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
    models.Attachment.hasMany(models.Attach,{
      foreignKey: 'attachmentID',
      onDelete: 'cascade',
    })
  };
  return Attachment;
};