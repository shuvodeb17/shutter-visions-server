const express = require('express')
const app = express()
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const coursesCollection = client.db('visionsDB').collection('courses')


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

    app.get('/all-users', async (req, res) => {
      const result = await usersCollection.find({}).toArray()
      res.send(result)
    })




    // make admin
    /*  app.patch('/users/admin/:id', async (req, res) => {
       const id = req.params.id;
       const filter = { _id: new ObjectId(id) }
       const updateDoc = {
         $set: {
           role: 'admin',
         }
       }
       const result = await usersCollection.updateOne(filter, updateDoc)
       res.send(result)
     }) */

    /* app.get('/users/admin/:id',async(req,res)=>{
      const id  = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.findOne(query)
      res.send(result)
    }) */

    /* app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      /* if (req.decoded.email !== email) {
        res.send({ admin: false });
      } */
    /* const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { admin: user?.role == 'admin' };
    res.send(result)
  }) */



    // make instructor
    /* app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'instructor',
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    }) */

    // check admin instructor 
    /* app.get('/users/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {email: email}
      const result = await usersCollection.findOne(query)
      res.send(result)
    }) */


    // post course
    app.post('/courses', async (req, res) => {
      const courses = req.body;
      const result = await coursesCollection.insertOne(courses);
      res.send(result)
    })

    app.get('/all-courses', async (req, res) => {
      const result = await coursesCollection.find({}).toArray()
      res.send(result)
    })

    app.get('/courses/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await coursesCollection.findOne(filter)
      res.send(result)
    })

    app.patch('/updates/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'approved',
        }
      }
      const result = await coursesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // specific courses
    app.get('/my-courses', async (req, res) => {
      let query = {};
      if (req.query?.instructorEmail) {
        query = { instructorEmail: req.query.instructorEmail }
      }
      const result = await coursesCollection.find(query).toArray()
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
