require('dotenv').config();
const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// const {
//   DB_USER,
//   DB_PASSWORD,
//   DB_HOST,
//   DB_PORT,
//   DB_NAME
// } = process.env;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  native: false,
  dialect: 'postgres',
});

const basename = path.basename(__filename);
const modelDefiners = [];

fs.readdirSync(path.join(__dirname, '/models'))
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

modelDefiners.forEach(model => model(sequelize));

let entries = Object.entries(sequelize.models);
let capsEntries = entries.map(entry => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

const { Videogame, Genre, User, Comment, PurchaseOrder } = sequelize.models;

// Relaciones (igual que tienes)

Videogame.belongsToMany(Genre, { through: 'VideogameGenre' });
Videogame.belongsToMany(User, { through: 'VideogameUser' });
Videogame.belongsToMany(Comment, { through: 'VideogameComment' });
Videogame.belongsToMany(PurchaseOrder, { through: 'VideogamePurchaseOrder' });

Genre.belongsToMany(Videogame, { through: 'VideogameGenre' });

User.belongsToMany(Comment, { through: 'UserComment' });
User.belongsToMany(Videogame, { through: 'VideogameUser' });
User.belongsToMany(PurchaseOrder, { through: 'UserPurchaseOrder' });

Comment.hasOne(Videogame, { through: 'VideogameComment' });
Comment.hasOne(User, { through: 'UserComment' });

PurchaseOrder.belongsToMany(Videogame, { through: 'VideogamePurchaseOrder' });
PurchaseOrder.belongsTo(User, { through: 'UserPurchaseOrder' });

module.exports = {
  ...sequelize.models,
  conn: sequelize,
  Op,
};