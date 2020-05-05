'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_name: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email_verification: {
      type: DataTypes.BOOLEAN,
      required: true,
      defaultValue: false
    },
    key_verification: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true
    },
  }, {});
  User.associate = function(models) {
    models.User.hasMany(models.Project,{
      foreignKey: 'fk_user_id',
      onDelete: 'cascade',
    })

    models.User.hasMany(models.Dataset,{
      foreignKey: 'fk_user_id',
      onDelete: 'cascade',
    })
  };
  return User;
};