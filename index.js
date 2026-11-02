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


app.get('/', (req, res) => [
  res.send({message:'server is runing'})
])

app.get('/api/event-type', async (req, res) => {
  const eventType = await eventTypeC.find().toArray()
  console.log(eventType);
  res.send(eventType)
})

// app.post('/api/post', (req, res) => {
//   const data = req.body
//   res.send("Recieved??")
//   console.log(data)
// })





const port = process.env.PORT || 5100;
app.listen(port, () => {
  console.log();
})
