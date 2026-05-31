const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'stockapp',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
  }
);

const UserModel = require('./User');
const AlertModel = require('./Alert');

const User = UserModel(sequelize);
const Alert = AlertModel(sequelize);

// Associations
User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Alert };
