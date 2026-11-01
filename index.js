import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb';
import 'dotenv/config'

const app = express()
const client = new MongoClient(process.env.MONGODB_URL);

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => [
  res.send('Working')
])


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
connectToMongoDB();


const port = process.env.PORT || 5100;
app.listen(port, () => {
  console.log();
})
