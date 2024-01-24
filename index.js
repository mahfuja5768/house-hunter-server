const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

const port = process.env.PORT || 8000;

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

    app.get("/search/:key", async (req, res) => {
      const result = await propertyCollection
        .find({
          $or: [
            { city: { $regex: req.params.key, $options: "i" } },
            { rent_per_month: { $eq: parseInt(req.params.key) } },
            { room_size: { $eq: parseInt(req.params.key) } },
            { bathrooms: { $eq: parseInt(req.params.key) } },
            { bedrooms: { $eq: parseInt(req.params.key) } },
          ],
        })
        .toArray();

      res.send(result);
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
    app.post("/bookings", async (req, res) => {
      try {
        const MAX_BOOKINGS_ALLOWED = 2;
        const property = req.body;
        const userEmail = property.userEmail;
        const propertyId = property.propertyId;
        const existingBooking = await bookingCollection.findOne({
          userEmail,
          propertyId,
        });

        if (existingBooking) {
          return res.send({
            message: "You have already booked this property.",
          });
        }

        const existingBookingsCount = await bookingCollection.countDocuments({
          userEmail,
        });

        if (existingBookingsCount >= MAX_BOOKINGS_ALLOWED) {
          return res.send({
            message: "Maximum bookings reached for this user's email.",
          });
        }
        const result = await bookingCollection.insertOne(property);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get booked properties for users
    app.get("/bookings-for-users", async (req, res) => {
      try {
        const email = req.query?.email;
        const query = { userEmail: email };
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //delete booked property
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // admin post new properties
    app.post("/admin-properties", async (req, res) => {
      try {
        const property = req.body;
        const result = await propertyCollection.insertOne(property);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get admin added properties
    app.get("/admin-properties", async (req, res) => {
      try {
        const email = req.query?.email;
        const query = { email: email };
        const result = await propertyCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //update property by admin
    app.patch("/admin-properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const property = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            address: property.address,
            availability_date: property.availability_date,
            bathrooms: property.bathrooms,
            bedrooms: property.bedrooms,
            city: property.city,
            description: property.description,
            phone_number: property.phone_number,
            rent_per_month: property.rent_per_month,
            room_size: property.room_size,
          },
        };
        console.log(updatedDoc);
        const result = await propertyCollection.updateOne(filter, updatedDoc);
        console.log(result);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // admin delete properties
    app.delete("/admin-properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await propertyCollection.deleteOne(query);
        res.send(result);
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
