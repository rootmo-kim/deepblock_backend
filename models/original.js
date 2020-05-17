'use strict';
module.exports = (sequelize, DataTypes) => {
  const Original = sequelize.define('Original', {
    originaPath: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Original.associate = function(models) {
    // associations can be defined here
  };
  return Original;
};