const { Router } = require("express");
const axios = require("axios");
const { Videogame, Genre, User } = require("../db");
const router = Router();
const { API_KEY } = process.env;
const json = require("../harcode.json");
const { Op, Sequelize, DataTypes } = require("sequelize");
//Post

const getRowTableVideoGames = async (req, res) => {
  try {
    const count = await Videogame.count();

    res.status(200).json(count.toString());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const addGenreDB = async (genres) => {
  if (genres) {
    try {
      let currentGenres = await Genre.findAll({ attributes: ["name"] });

      let newGenres = genres.filter(
        (eArr2) =>
          !currentGenres.find((eArr1) => eArr2 == eArr1.dataValues.name)
      );

      if (newGenres.length > 0) {
        let promisesDb = newGenres.map(async (e) => {
          return await Genre.create({ name: e });
        });
        let addedGenres = await Promise.all(promisesDb);

        return { success: `new genres created in db`, newGenres: newGenres };
      } else {
        return { failed: "those genres already exist" };
      }
    } catch (error) {
    }
  } else {
    return { error: "a genre or arr of genres is required" };
  }
};

const videogamePost = async (req, res) => {
  try {
    const {
      name,
      background_image,
      rating_api,
      rating_user,
      description,
      released,
      price,
      images,
      requirements,
      genres,
      trailer,
      stock,
      newGenres,
    } = req.body;

    if (name) {
      const newVideogame = await Videogame.create({
        name,
        background_image,
        rating_api,
        rating_user,
        description,
        released,
        price,
        images,
        requirements,
        stock,
      });

      if (newGenres) {
        let response = await addGenreDB(newGenres);

        if (response.success) {
          try {
            let allGenres = newGenres.concat(...genres);

            let genresDb = await Genre.findAll({
              where: { name: allGenres },
            });

            await newVideogame.addGenre(genresDb);
            res.status(200).json({
              msg: "game was created",
              newgenre: response,
              newgame: newVideogame,
            });
          } catch (error) {
          }
        } else {
          res.status(200).json({
            msg: "game was created",
            newgenre: response,
            newgame: newVideogame,
          });
        }
      } else {
        res.status(200).json(newVideogame);
      }
    } else {
      res.status(404).send({ msg: "a name is required" });
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

const getAllGames = async (req, res) => {
  const { filter = "" } = req.query;
  const { name, rating, price, genre } = filter;
  const { options = "" } = req.query;
  let { page = 1 } = options;
  const order = options?.sort && [["name", options.sort.toUpperCase()]];
  if (page < 1) page = 1;

  const where = {};
  const genreFilter = {};

  where.stock = { [Op.gte]: 1 };
  if (name)
    where.name = {
      [Op.iLike]: `%${name}%`,
    };

  if (rating) {
    where.rating_api = Sequelize.where(
      Sequelize.fn("ROUND", Sequelize.col("rating_api")),
      {
        [Op.eq]: rating,
      }
    );
  }
  if (genre)
    genreFilter.name = {
      [Op.iLike]: genre,
    };
  if (price) {
    switch (price) {
      case "25":
        where.price = {
          [Op.and]: [{ [Op.gte]: "0" }, { [Op.lte]: "25" }],
        };
        break;
      case "50":
        where.price = {
          [Op.and]: {
            [Op.gt]: "25",
            [Op.lte]: "50",
          },
        };

        break;
      case "75":
        where.price = {
          [Op.and]: {
            [Op.gt]: "50",
            [Op.lte]: "75",
          },
        };
        break;
      case "100":
        where.price = {
          [Op.and]: {
            [Op.gt]: 75,
            [Op.lte]: 100,
          },
        };
        break;
      default:
        where.price = {
          [Op.and]: [
            { [Op.gte]: Number(price) - 25 },
            { [Op.lte]: Number(price) },
          ],
        };
    }
  }

  let config = {
    distinct: true,
    include: {
      model: Genre,
      where: genreFilter,
      through: {
        attributes: [],
      },
      attributes: ["name"],
    },
    where,
    order,
    offset: (Number(page) - 1) * 10,
    limit: 10,
  };
  try {
    let { count, rows } = await Videogame.findAndCountAll(config);
    if (rows.length) {
      res.json({
        status: "success",
        offset: (page - 1) * 10,
        total: count,
        results: rows.length,
        games: rows,
      });
    } else {
      let message;
      if (filter?.name) message = "No se encontro el juego buscado";
      else message = "No hay juegos disponibles";
      res.status(404).send(message);
    }
  } catch (error) {
    res.status(400).send(error);
  }
};
const getUserGames = async (req, res) => {
  const { id } = req.params;
  try {
    const userGames = await Videogame.findAll({
      include: {
        model: User,
        where: { id },
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    });
    if (!userGames.length) {
      res.status(404).send("This user don't have any game yet");
    } else {
      res.json(userGames);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};
const videogameByID = async (req, res) => {
  const { id } = req.params;

  try {
    const videoGameDb = await Videogame.findOne({
      where: { id: id },

      include: {
        model: Genre,
        attributes: ["name"],
        through: {
          attributes: [],
        },
      },
    });

    res.json(videoGameDb);
  } catch (error) {
    res.send(error);
  }
};

const getGenres = async (req, res) => {
  try {
    const data = await Genre.findAll({ attributes: ["name"] });
    res.send(data);
  } catch (error) {
  }
};

const getDiscounts = async (req, res) => {
  try {
    const discounts = await Videogame.findAll({
      where: {
        "discount.status": true,
      },
    });
    if (!discounts.length) {
      return res.status(404).send("Don't exist any discount");
    }
    res.json(discounts);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateVideogame = async (req, res) => {
  let { id } = req.params;
  let {
    name,
    background_image,
    rating_api,
    rating_user,
    description,
    released,
    price,
    images,
    requirements,
    trailer,
  } = req.body;

  try {
    let find = await Videogame.findOne({ where: { id: id } });
    if (find) {
      await Videogame.update(
        {
          name: name ? name : find.name,
          background_image: background_image
            ? background_image
            : find.background_image,
          rating_api: rating_api ? rating_api : find.rating_api,
          rating_user: rating_user ? rating_user : find.rating_user,
          description: description ? description : find.description,
          released: released ? released : find.released,
          price: price ? price : find.price,
          images: images ? images : find.images,
          requirements: requirements ? requirements : find.requirements,
          trailer: trailer ? trailer : find.trailer,
        },
        { where: { id: id } }
      );
      return res.send({ msg: "Updated successfully" });
    }
    res.send({ msg: "Videogame doesn't exist" });
  } catch (error) {
    res.status(500).send(error);
  }
};

const UpdateStock = async (req, res) => {
  let { gameID, amount, operador } = req.body;

  if (gameID && amount && operador) {
    try {
      const subUpdated = async (amount) => {
        const updatedRows = await Videogame.update(
          {
            stock: Sequelize.literal(`stock - ${amount}`),
          },
          { where: { id: gameID }, returning: true, plain: true }
        );

        return updatedRows[1].dataValues.stock;
      };
      const sumUpdated = async (amount) => {
        const updatedRows = await Videogame.update(
          {
            stock: Sequelize.literal(`stock + ${amount} `),
          },
          { where: { id: gameID }, returning: true, plain: true }
        );

        return updatedRows[1].dataValues.stock;
      };

      if (operador == "sum") {
        let newStock = await sumUpdated(amount);
        return res.status(200).send({ msg: `New stock ${newStock}` });
      } else if (operador == "sub") {
        let newStock = await subUpdated(amount);
        return res.status(200).send({ msg: `New stock ${newStock}` });
      }
    } catch (error) {
    }
  } else {
    res.status(404).send({
      error: "gameID, amount and operador (sum, sub) are required by body",
    });
  }
};
module.exports = {
  videogamePost,
  videogameByID,
  getGenres,
  updateVideogame,
  getAllGames,
  getDiscounts,
  getRowTableVideoGames,
  getUserGames,
  UpdateStock,
};
