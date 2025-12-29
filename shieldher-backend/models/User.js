const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
    defaultValue: 'unverified'
  },
  verificationImage: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  inviteCode: {
    type: DataTypes.STRING,
    defaultValue: null
  }
}, {
  timestamps: true
});

module.exports = User;
