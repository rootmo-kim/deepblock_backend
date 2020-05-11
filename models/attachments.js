'use strict';
module.exports = (sequelize, DataTypes) => {
  const Attachments = sequelize.define('Attachments', {
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
  Attachments.associate = function(models) {
    models.Attachments.hasMany(models.Attaches,{
      foreignKey: 'fk_attachments_id',
      onDelete: 'cascade',
    })
  };
  return Attachments;
};