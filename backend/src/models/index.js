import { Sequelize } from 'sequelize';
import { defineUser } from './User.js';
import { defineAlert } from './Alert.js';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'stockapp',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
  },
);

const User = defineUser(sequelize);
const Alert = defineAlert(sequelize);

// Associations
User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

export { sequelize, User, Alert };
