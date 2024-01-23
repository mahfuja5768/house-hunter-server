const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const propertyCollection = client
      .db("houseHunter")
      .collection("properties");
    const usersCollection = client.db("houseHunter").collection("users");

    //post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (!existingUser) {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } else {
        return res.send({ message: "user already exists", insertedId: null });
      }
    });

    app.post("/login", async (req, res) => {
      const user = req.body;
      if (user.password && user.email) {
        const query = { email: user.email, password: user.password };
        const loginAUser = await usersCollection.findOne(query, {
          projection: { password: 0, phnNum: 0, _id: 0 },
        });
        if (loginAUser) {
          res.send(loginAUser);
        } else {
          res.send({ message: "No user Found" });
        }
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("house-hunter-server is running....");
});

app.listen(port, (req, res) => {
  console.log(`house-hunter-server is running on ${port}`);
});
