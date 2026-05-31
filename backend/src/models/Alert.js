const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    symbol: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    targetPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
    triggered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  return Alert;
};
