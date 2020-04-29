'use strict';
module.exports = (sequelize, DataTypes) => {
  const Train = sequelize.define('Train', {
    result_path: {
      allowNull: false,
      type: DataTypes.STRING,
    }
  }, {});
  Train.associate = function(models) {
    // associations can be defined here
  };
  return Train;
};