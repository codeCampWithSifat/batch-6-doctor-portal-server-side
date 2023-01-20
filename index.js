const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()

// use all the middleware
app.use(express.json());
app.use(cors());

const uri =
  "mongodb+srv://<username>:<password>@cluster0.qahuo.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

app.get("/", (req, res) => {
  res.send("Hello Doctor Portal");
});

app.listen(port, () => {
  console.log(`Listening to the port ${port} successfully`);
});
