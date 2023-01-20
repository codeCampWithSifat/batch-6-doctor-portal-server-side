const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()

// use all the middleware
app.use(express.json());
app.use(cors());


const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qahuo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

  async function run () {
    try {
     const appointmentOptionsCollection = client.db("batch6_doctors_portal").collection("appointmentOptions");
     const bookingsCollection = client.db("batch6_doctors_portal").collection("bookings");
      
     app.get("/appointmentOptions", async(req,res) => {
       const query = {};
       const cursor = appointmentOptionsCollection.find(query);
       const result = await cursor.toArray();
       res.send(result);
     })

     // book a appointment from the user interface
     app.post("/bookings", async(req,res) => {
      const booking = req.body ;
      const result = await bookingsCollection.insertOne(booking);
      console.log(result)
      res.send(result);
     })

    } finally {

    }
  }
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Doctor Portal");
});

app.listen(port, () => {
  console.log(`Listening to the port ${port} successfully`);
});
