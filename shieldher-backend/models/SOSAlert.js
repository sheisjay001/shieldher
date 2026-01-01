const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const SOSAlert = sequelize.define('SOSAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved'),
    defaultValue: 'active'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = SOSAlert;