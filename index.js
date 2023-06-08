const express = require('express')
const app = express()
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b0yctrm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db('visionsDB').collection('users')


    // user collection
    app.post('/users', async (req, res) => {
      const data = req.body;
      const query = { email: data.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'User already exits' })
      }
      const result = await usersCollection.insertOne(data)
      res.send(result)
    })
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("database connected");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
  res.send('Shutter Visions server is running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
