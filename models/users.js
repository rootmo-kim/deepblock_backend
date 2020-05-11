'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    username: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email: {
      unique: true,
      allowNull: false,
      type: DataTypes.STRING
    },
    isVerify: {
      required: true,
      defaultValue: false,
      type: DataTypes.BOOLEAN
    },
    verifyKey: {
      required: true,
      allowNull: false,
      type: DataTypes.STRING
    },
  }, {});
  Users.associate = function(models) {
    models.Users.hasMany(models.Projects,{
      foreignKey: 'fk_users_id',
      onDelete: 'cascade',
    })

    models.Users.hasMany(models.Dataset,{
      foreignKey: 'fk_users_id',
      onDelete: 'cascade',
    })
  };
  return Users;
};