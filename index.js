import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb';
import 'dotenv/config'

const app = express()
const client = new MongoClient(process.env.MONGODB_URL);


app.use(cors())
app.use(express.json())



export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db('ripple')
//C - Collection
const eventTypeC = db.collection('event_type');
const eventsCollection = db.collection('events');


const today = () => new Date().toISOString().split("T")[0];

app.get('/', (req, res) => [
  res.send({message:'server is runing'})
])

app.get('/api/event-type', async (req, res) => {
  const eventType = await eventTypeC.find().toArray()
  res.send(eventType);
})

app.post('/api/create-events', async (req, res) => {
  const data = req.body
  const response = await eventsCollection.insertOne(data)
  res.send(response)
  console.log(data);
})

app.get('/api/events', async (req, res) => {
  const data = await eventsCollection.find({
    eventDate: {
      $gte: today()
    }
  }).sort({eventDate: 1}).toArray()
  res.send(data);
})

//Individual data
// app.get('/api/events/:id', async (req, res) => {
//   const data = await eventsCollection.find().toArray()
//   res.send(data);
// })


app.get('/api/events/featured', async (req, res) => {
  const data = await eventsCollection.find({
    eventDate: {
      $gte: today()
    }
  }).limit(6).toArray()
  res.send(data);
})

app.get('/api/events/past-events', async (req, res) => {
  const data = await eventsCollection.find({
    eventDate: {
      $lt: today()
    }
  }).toArray()
  res.send(data);

})

app.get('/api/events/manage', async (req, res) => {
  const data = await eventsCollection.find({
    organizer: {
      $eq: 'karim@gmail.com'
    }
  }).toArray()
  res.send(data);
  
})


const port = process.env.PORT || 5100;
app.listen(port, () => {
  console.log(`Server running on ${process.env.BASE_URL}:${port}/`);
})

export default app;
