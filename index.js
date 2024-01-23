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
    const bookingCollection = client.db("houseHunter").collection("bookings");

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

    //for user login
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

    // get properties
    app.get("/properties", async (req, res) => {
      try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        const properties = await propertyCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();
        // console.log(properties)
        res.send(properties);
      } catch (error) {
        console.log(error);
      }
    });

    //get single properties
    app.get("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await propertyCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //book a property
    app.post("/bookings", verifyToken, async (req, res) => {
      try {
        const property = req.body;
        const result = await bookingCollection.insertOne(property);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get a booked property
    app.get("/bookings/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get booked properties for users
    app.get("/bookings/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        const query = { buyerEmail: email };
        const properties = await bookingCollection.find(query).toArray();
        res.send(properties);
      } catch (error) {
        console.log(error);
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
