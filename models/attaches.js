'use strict';
module.exports = (sequelize, DataTypes) => {
  const Attaches = sequelize.define('Attaches', {
    originalName: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  Attaches.associate = function(models) {
    // associations can be defined here
  };
  return Attaches;
};