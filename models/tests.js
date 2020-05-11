'use strict';
module.exports = (sequelize, DataTypes) => {
  const Tests = sequelize.define('Tests', {
    loss: {
      allowNull: false,
      type: DataTypes.DOUBLE
    },
    accuracy: {
      allowNull: false,
      type: DataTypes.DOUBLE
    }
  }, {});
  Tests.associate = function(models) {
    // associations can be defined here
  };
  return Tests;
};