const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const fileUpload = require("express-fileupload");
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const { MongoClient, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yai2s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("RiderDB");
    const usersCollection = database.collection("users");

    // post the rider information
    app.post("/addRider", async (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const age = req.body.age;
      const address = req.body.address;
      const phone = req.body.phone;
      const area = req.body.area;
      const vehicleModal = req.body.vehicleModal;
      const vehicleType = req.body.vehicleType;
      const role = req.body.role;
      const licencePic = req.files.licencePic;
      const nidPic = req.files.nidPic;
      const profilePic = req.files.profilePic;

      const picData1 = licencePic.data;
      const picData2 = nidPic.data;
      const picData3 = profilePic.data;
      const encodedPic1 = picData1.toString("base64");
      const encodedPic2 = picData2.toString("base64");
      const encodedPic3 = picData3.toString("base64");
      const licenceImage = Buffer.from(encodedPic1, "base64");
      const nidImage = Buffer.from(encodedPic2, "base64");
      const profileImage = Buffer.from(encodedPic3, "base64");

      const rider = {
        name,
        email,
        age,
        address,
        phone,
        area,
        vehicleModal,
        vehicleType,
        licenceImage,
        nidImage,
        profileImage,
        role,
      };

      const result = await usersCollection.insertOne(rider);
      res.send(result);
    });

    // post the learner information
    app.post("/addLearner", async (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const age = req.body.age;
      const address = req.body.address;
      const phone = req.body.phone;
      const vehicleType = req.body.vehicleType;
      const role = req.body.role;
      const nidPic = req.files.nidPic;
      const profilePic = req.files.profilePic;

      const picData2 = nidPic.data;
      const picData3 = profilePic.data;
      const encodedPic2 = picData2.toString("base64");
      const encodedPic3 = picData3.toString("base64");
      const nidImage = Buffer.from(encodedPic2, "base64");
      const profileImage = Buffer.from(encodedPic3, "base64");

      const rider = {
        name,
        email,
        age,
        address,
        phone,
        vehicleType,
        nidImage,
        profileImage,
        role,
      };

      const result = await usersCollection.insertOne(rider);
      res.send(result);
    });

    // find the user information from users collection
      app.get('/userProfile/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email: email };
          const result = await usersCollection.findOne(query);
          res.send(result);
      })

    // get all users from database
    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let users;

      const count = await cursor.count();

      if (page) {
        users = await cursor.skip(page * size).limit(size).toArray();
      }
      else {
        users = await cursor.toArray();
      }

      res.send({ count, users });
    })

    // create payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        payment_method_types: ['card']
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    })

    // payment data store api
    app.put('/payments/:id', async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
      // console.log(result);
    })
    
      
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Hero Rider Server is running...`);
});

app.listen(port, (req, res) => {
  console.log(`Hero Rider Server is running on port: ${port}`);
});
