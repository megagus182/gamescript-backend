const { User } = require('../db');
const { uuid } = require('uuidv4');
const { firebaseApp } = require('../firebase/credenciales');
const { Op } = require('sequelize');
const {
	createUserWithEmailAndPassword,
	getAuth,
	sendSignInLinkToEmail,
} = require('firebase/auth');

const UserPost = async (req, res) => {
	const auth = getAuth(firebaseApp);
	function hashFunction(key) {
		const splittedWord = key.toLowerCase().split('');
		const codes = splittedWord.map(
			(letter) => `${letter}${String(letter).charCodeAt(0)}`
		);
		return codes.join('');
	}
	const { email, password, prevCart } = req.body;
	try {
		const { user } = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		const newUser = await User.create({
			id: user.uid,
			email,
			name: email,
			password: hashFunction(password),
		});
		await newUser.update({ cart: prevCart });
		const actionCodeSettings = {
			url: 'http://localhost:3000/',
			handleCodeInApp: true,
		};
		sendSignInLinkToEmail(auth, email, actionCodeSettings);
		res.status(201).json({ msg: 'User create!' });
	} catch {
		res.status(400).json({ msg: 'User not create!' });
	}
};

const getDbById = async (id) => {
	return await User.findByPk(id);
};

const UserByName = async (req, res) => {
	const { name } = req.body;
	if (name) {
		try {
			let found = await User.findAll({
				where: { name: { [Op.iLike]: `%${name}%` } },
			});

			if (found) {
				res.status(200).send(found);
			} else {
				res.status(404).send({ msg: 'user not found' });
			}
		} catch (error) {
		}
	} else {
		return res.status(404).send({ msg: 'a name is required by body' });
	}
};
const UserByID = async (req, res) => {
	const { id } = req.params;
	try {
		let user = await getDbById(id);
		return res.status(200).json(user);
	} catch {
		return res.status(400).send('User does not exist');
	}
};

const allDataUser = async (req, res) => {
	const { filter = '' } = req.query;
	const { name } = filter;
	const where = {};
	if (name) {
		where.name = {
			[Op.iLike]: `%${name}%`,
		};
	}

	try {
		const info = await User.findAll({ where });
		if (info.length === 0) {
			res.send('User does not exist');
		} else {
			res.status(200).json(info);
		}
	} catch (error) {
		res.status(400).json({ error: 'Error User' });
	}
};

const UserUpdate = async (req, res) => {
	const { id } = req.params;
	const props = { ...req.body };
	try {
		let modifique = await User.update(
			props,

			{
				where: {
					id: id,
				},
			}
		);

    let user = await getDbById(id);

		res.status(200).json({ user, modifique, msg: 'User updated!' });
	} catch (error) {
		res.status(400).json({ error: 'Error update User' });
	}
};

const PostLogin = async (req, res) => {
		const { email } = req.body;
		try {
			let found = await User.findOne({ where: { email: email } });
			if(found?.available === false) return res.status(400).send('User does not available');
			if(req.query.google && !found) {
				const newUser = await User.create({...req.body})
				return res.json(newUser)
			}
			if (found) {
				return res.status(200).send(found);
			} else {
				return res.status(404).send({ msg: 'sorry, this email is not exist' });
			}
		} catch (error) {
			res.status(400).send(error);
		}
};

const addNotification = async (req, res) => {
	const { id } = req.params;
	const { text } = req.body
	try {
		let user = await User.findOne({where: {id}});

    await user.update({
			notifications: [
				...user.notifications,
				{
					id: uuid(),
					text
				}
			]
		})

		res.status(201).send('Notification added');
	} catch (error) {
		res.status(400).json({ error: 'Error update User' });
	}
}
/*
     filtro para ordenar por stock el admin en front 
    const OrdenXStock = 
        action.payload === "min" ?
        videogames.sort(function (a, b) {
            if (a.stock > b.stock) return 1;
            if (b.stock > a.stock) return -1;
            return 0;
        })
        : videogames.sort(function (a, b) {
            if (a.stock > b.stock) return -1;
            if (b.stock > a.stock) return 1;
            return 0;
        
        });
            return {
            ...state,
            videogames: sortedByRating.map((e) => e),
            };
*/
module.exports = {
	allDataUser,
	UserByID,
	UserByName,
	UserPost,
	UserUpdate,
	PostLogin,
	addNotification
};
