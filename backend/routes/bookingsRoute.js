const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;


// Connect to MongoDB
const url = 'mongodb://127.0.0.1';
const dbName = 'new-project';

require('dotenv').config();
const express = require("express");
const router = express.Router();
const Booking = require("../models/bookingModel");
const Car = require("../models/carModel");
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.BACK_END_STRIPE_KEY);
// const stripe = require("stripe")("sk_test_51OKkBpSF6Amir5MpVgf3kWN42M5pqbTA3ykKrDjYYYiJEOdJG0OIIYcOY1XFYf92hexiLsSH8rVggorOcpe2p5bR00EFWkWQzw");
router.post("/bookcar", async (req, res) => {
  console.log("this is token:",req.body);
  const { token } = req.body;
  console.log("Token received:", token);
  try {
    const customer = await stripe.customers.create({
      email: token?.email,
      source: token?.id,
    });
    console.log(customer.id);
    const payment = await stripe.paymentIntents.create(
      {
        amount: req.body.totalAmount * 100,
        // currency: "inr",
        currency: "INR",
        customer: customer?.id,
        receipt_email: token?.email
      },
      {
        idempotencyKey: uuidv4(),
        
      }
    );

    // if (payment && payment.status === "succeeded") {
    //   req.body.transactionId = payment.source.id;
    //   const newbooking = new Booking(req.body);
    //   await newbooking.save();
    //   const car = await Car.findOne({ _id: req.body.car });
    //   console.log(req.body.car);
    //   car.bookedTimeSlots.push(req.body.bookedTimeSlots);

    //   await car.save();
    //   res.send("Your booking is successfull");
    // } else {
    //   return res.status(400).json(error);
    // }
    if (payment && payment.status === "succeeded") {
      // req.body.transactionId = payment.id;
      const newbooking = new Booking(req.body);
      await newbooking.save();

      const car = await Car.findOne({ _id: req.body.car });
      car.bookedTimeSlots.push(req.body.bookedTimeSlots);
      await car.save();

      res.send("Your booking is successful");
    } else {
      console.error("Payment failed:", payment.failure_message);
      const newbooking = new Booking(req.body);
      await newbooking.save();

      const car = await Car.findOne({ _id: req.body.car });
      car.bookedTimeSlots.push(req.body.bookedTimeSlots);
      await car.save();

      res.send("Your booking is successful");


      MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
        if (err) throw err;
      
        const db = client.db(dbName);
        const collection = db.collection('your_collection');
      
        // Query MongoDB for data
        const data = await collection.findOne({ /* your query */ });
      
        // Close the MongoDB connection
        client.close();
      
        // Send email using Nodemailer
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'sainiranjangalipelli@gmail.com',
            pass: 'zpeh ugjr wmnu qefu',
          },
        });
      
        const mailOptions = {
          from: 'sainiranjangalipelli@gmail.com',
          to: token.email,
          subject: 'Booking conformation',
          text: `your product has been booked for time slot ${req.body.bookedTimeSlots.from} to ${req.body.bookedTimeSlots.to}`,
          // const fromFormatted :moment(req.bookedTimeSlots.from).format('MMM DD YYYY HH:mm'),
          // const toFormatted :moment(req.bookedTimeSlots.to).format('MMM DD YYYY HH:mm'),
          // text :'your product has been booked for time slot ' + fromFormatted + ' ' + toFormatted
        };
      
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.error(error);
          }
          console.log('Email sent: ' + info.response);
        });
      });


      // return res.status(400).json({ error: "Payment failed", message: payment.failure_message });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});


router.get("/getallbookings", async(req, res) => {

    try {

        const bookings = await Booking.find().populate('car')
        res.send(bookings)
        
    } catch (error) {
        return res.status(400).json(error);
    }
  
});


module.exports = router;