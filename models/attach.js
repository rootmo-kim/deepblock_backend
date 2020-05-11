'use strict';
module.exports = (sequelize, DataTypes) => {
  const Attach = sequelize.define('Attach', {
    originalName: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Attach.associate = function(models) {
    // associations can be defined here
  };
  return Attach;
};