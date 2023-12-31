const express = require('express')
const app = express()
require("dotenv").config();
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
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
    // await client.connect();
    const usersCollection = client.db('visionsDB').collection('users')
    const coursesCollection = client.db('visionsDB').collection('courses')
    const paymentsCollection = client.db('visionsDB').collection('payments')
    const selectedClassesCollection = client.db('visionsDB').collection('selected')


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

    app.get('/specific-user', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })




    // make admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin',
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.findOne(query)
      res.send(result)
    })



    // make instructor
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'instructor',
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })



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

    // approved 
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

    // approved course
    app.get('/all-classes', async (req, res) => {
      const filter = { status: 'approved' }
      const result = await coursesCollection.find(filter).toArray()
      res.send(result)
    })

    // popular classes
    app.get('/popular-classes', async (req, res) => {
      const query = { status: 'approved' }
      const options = {
        sort: { "enrolled": -1 }
      };
      const result = await coursesCollection.find(query, options).limit(6).toArray()
      res.send(result)
    })


    // top instructor
    app.get('/top-instructor', async (req, res) => {
      const result = await coursesCollection.find().limit(6).toArray()
      res.send(result)
    })

    // instructor
    app.get('/instructor-all', async (req, res) => {
      const result = await coursesCollection.find().toArray()
      res.send(result)
    })

    // deny single
    app.patch('/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'deny',
        }
      }
      const result = await coursesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })


    // feedback
    app.patch('/feedback/:id', async (req, res) => {
      const feedback = req.body.feedback;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          feedback: `${feedback}`,
        }
      }
      const result = await coursesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get('/all-feedback', async (req, res) => {
      const result = await coursesCollection.find().toArray()
      res.send(result)
    })

    // deny get data
    app.get('/all-deny', async (req, res) => {
      const filter = { status: 'deny' }
      const result = await coursesCollection.find(filter).toArray()
      res.send(result)
    })


    // const create payment intent 
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })

    // save payments data to database
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment)
      res.send(result)
    })

    // payments specific user
    app.get('/payments-details-specific', async (req, res) => {
      let query = {};
      const options = {
        sort: { "date": -1 }
      };
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await paymentsCollection.find(query, options).toArray()
      res.send(result)
    })



    // seats - 1, enroll + 1
    app.patch('/payments/:id', async (req, res) => {
      const seats = req.body.seats;
      const enrolled = req.body.enrolled;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          seats: seats - 1,
          enrolled: parseInt(enrolled + 1),
        }
      }
      const result = await coursesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // selected class
    app.post('/selected-course', async (req, res) => {
      const allCourses = req.body;
      delete allCourses._id;
      const result = await selectedClassesCollection.insertOne(allCourses)
      res.send(result)
    })

    app.get('/course-select', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await selectedClassesCollection.find(query).toArray()
      res.send(result)
    })

    app.patch('/selected-payments/:id', async (req, res) => {
      const seats = req.body.seats;
      const enrolled = req.body.enrolled;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          seats: seats - 1,
          enrolled: parseInt(enrolled + 1),
        }
      }
      const result = await selectedClassesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })


    // delete id
    app.delete('/select-item-delete/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await selectedClassesCollection.deleteOne(filter)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
