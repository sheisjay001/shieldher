const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true // Can be null if only media is posted
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'none'),
    defaultValue: 'none'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Post;
