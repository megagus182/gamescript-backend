const { DataTypes, NOW } = require("sequelize");
module.exports = (sequelize) => {
  sequelize.define("PurchaseOrder", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    companyname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "GameScript",
    },
    companycuit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "20-45786529-3",
    },
    companyaddress: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "calle siempre viva 123",
    },
    companyemail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "GameScript@gmail.com",
    },
    games: {
      type: DataTypes.JSON,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "created",
      validate: {
        customValidator: (value) => {
          const enums = ["created", "inprocess", "canceled", "completed"];
          if (!enums.includes(value)) {
            throw new Error("not a valid option");
          }
        },
      },
    },
    totalprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    }
  });
};
