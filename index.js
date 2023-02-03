const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// use all the middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qahuo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const appointmentOptionsCollection = client
      .db("batch6_doctors_portal")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("batch6_doctors_portal")
      .collection("bookings");
    const userCollection = client
      .db("batch6_doctors_portal")
      .collection("users");

    //  use Aggregate to query multiple collection and then merge data

    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionsCollection.find(query).toArray();

      // get the booking of the provided date
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
      });
      res.send(options);
    });

    // book a appointment from the user interface
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        treatment: booking.treatment,
        email: booking.email,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You Already Have A Booking On ${booking.appointmentDate}`;
        return res.send({ acknowledge: false, message });
      }
      // console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // app.get("/bookings", verifyJWT ,async(req,res) => {
    //   const email = req.query.email;
    //   const decodedEmail = req.decoded.email;
    //   console.log(decodedEmail)
    //   if(email !== decodedEmail) {
    //     return res.status(403).send({message : "Unauthorized Access"})
    //   }
    //   const query = {email : email};
    //   const bookings = await bookingsCollection.find(query).toArray();
    //   res.send(bookings);
    // })

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      // console.log(req.headers.authorization);
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // create a user

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // generate a token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "Forbidden" });
    });
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
