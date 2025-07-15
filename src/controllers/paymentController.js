const express = require('express');
const Stripe = require('stripe');
require('dotenv').config(); // si no está ya
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const postPayment = async (req, res) => {
	// you can get more data to find in a database, and so on
	const { id, amount } = req.body;

	try {
		const payment = await stripe.paymentIntents.create({
			amount,
			currency: 'USD',
			description: 'Videogame',
			payment_method: id,
			confirm: true, //confirm the payment at the same time
		});

		return res.status(200).json({ message: 'Successful Payment' });
	} catch (error) {
		return res.json({ message: error.raw.message });
	}
};

module.exports = {
	postPayment,
};
