import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify } from 'jose';

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
const usersCollection = db.collection('user');
const joinEventCollection = db.collection('joined_event');

const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization
  console.log(authHeader);

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized attempt!" })
  }
  
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).send({ message: "Unauthorized attempt!" })

  }

  const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}`))

  try {
    const { payload } = await jwtVerify(token, JWKS)
    next()
  } catch {
    return res.status(500).send({ message: "Error. Unable to verify." })
  }

}

const today = () => new Date().toISOString().split("T")[0];

app.get('/', (req, res) => [
  res.send({ message: 'server is runing' })
])

app.get('/api/event-type', async (req, res) => {
  const eventType = await eventTypeC.find().toArray()
  res.send(eventType);
})

app.post('/api/create-events', verifyUser, async (req, res) => {
  console.log('called');
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
  }).sort({ eventDate: 1 }).toArray()
  res.send(data);
})



app.get('/api/events/featured', async (req, res) => {
  const data = await eventsCollection.find({
    eventDate: {
      $gte: today()
    }
  }).limit(6).sort({eventDate: 1}).toArray()
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

//for manage events

app.get('/api/events/manage/:email',verifyUser, async (req, res) => {
  const { email } = req.params
  
  const data = await eventsCollection.find({
    organizer: email
  }).toArray()

  res.send(data);

})


//verifyUser
//joined event user list get

app.get('/api/users', verifyUser, async (req, res) => {

  const users = await usersCollection.find({},{projection: {name: 1, email: 1, _id: 0}}).toArray()

  res.send(users);
})

//
app.post('/api/events/status-check',verifyUser, async (req, res) => {

  const { userEmail, eventId } = req.body
  const alreadyJoined = await joinEventCollection.findOne({
    joinedEventId: eventId,
    useremail: userEmail,
  });

  res.send({ users: alreadyJoined });
})




// joined event list post
app.post('/api/events/join',verifyUser, async (req, res) => {

  const joinedEvent = req.body;
  console.log(joinedEvent);
  const response = await joinEventCollection.insertOne(joinedEvent);

  console.log(response);
  res.send(response);
})

///leave event/delete
app.delete('/api/events/leave',verifyUser, async (req, res) => {
  const data = req.body
  const { userEmail, eventId } = data
  const response = await joinEventCollection.deleteOne({
    joinedEventId: eventId,
    useremail: userEmail,
  });

  res.send(response);
})




// app.get('/api/events/joined-event',verifyUser, async (req, res) => {
//   const data = await joinEventCollection.find().toArray();
//   res.send(data);

// })

app.get('/api/events/joined/:email', verifyUser ,async (req, res) => {

  const {email} = req.params
  const data = await joinEventCollection.find({$or: [{useremail: email}, {organizer: email}]}).toArray();
  
  res.send(data)

})




//get event volunteer count
app.get('/api/events/count/:id', async (req, res) => {

  const { id } = req.params;
  const event = await joinEventCollection.find({ joinedEventId: id}).toArray()
  res.send(event);

})


//get
app.get('/api/events/:id', async (req, res) => {

  const { id } = req.params;
  const event = await eventsCollection.findOne({
    _id: new ObjectId(id)
  })
  res.send(event);

})


//patch
app.patch('/api/events/:id',verifyUser, async (req, res) => {

  const { id } = req.params;
  const data = req.body;
  const response = await eventsCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set: data}
  )
  res.send(response);

})

//delete
app.delete('/api/events/:id',verifyUser, async (req, res) => {

  const { id } = req.params;
  const result = await eventsCollection.deleteOne(
    { _id: new ObjectId(id) }
  )
  res.send(result);
  console.log(result);

})




const port = process.env.PORT || 5100;
app.listen(port, () => {
  console.log(`Server running on ${process.env.BASE_URL}:${port}/`);
})

export default app;
