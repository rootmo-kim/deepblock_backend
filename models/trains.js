'use strict';
module.exports = (sequelize, DataTypes) => {
  const Trains = sequelize.define('Trains', {
    resultPath: {
      allowNull: false,
      type: DataTypes.STRING,
    }
  }, {});
  Trains.associate = function(models) {
    // associations can be defined here
  };
  return Trains;
};