const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('comment', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userComment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT
    },
    rating_like: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating_dislike: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

  })
};
