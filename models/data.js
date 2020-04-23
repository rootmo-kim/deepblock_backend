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
    // associations can be defined here
  };
  return data;
};