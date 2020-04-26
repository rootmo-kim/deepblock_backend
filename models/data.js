'use strict';
module.exports = (sequelize, DataTypes) => {
  const data = sequelize.define('data', {
    data_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  data.associate = function(models) {
    data.hasMany(models.project,{
      foreignKey: 'project_id'
    })

    data.belongsTo(models.user,{
      foreignKey: 'user_id'
    })
  };
  return data;
};