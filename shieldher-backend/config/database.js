const { Sequelize } = require('sequelize');
require('dotenv').config();
// Explicitly require mysql2 for Vercel/Webpack bundling
const mysql2 = require('mysql2');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectModule: mysql2, // Force Sequelize to use the required mysql2 module
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Set to true if you have the CA certificate and want to verify it
      }
    },
    logging: false
  }
);

module.exports = sequelize;
