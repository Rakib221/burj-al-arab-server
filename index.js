const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const port = 5000

var serviceAccount = require("./configs/burj-al-arab-fd90d-firebase-adminsdk-3n5ph-82fcb5c546.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const app = express()

app.use(cors());
app.use(bodyParser.json());

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tmhor.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingsCollection = client.db("burjAlArab").collection("allBookings");
  console.log('db connection successful');

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookingsCollection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking);
  })

  app.get('/bookingsCollection', (req, res) => {
    console.log(req.query.email);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail === queryEmail) {
            bookingsCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else{
            res.status(401).send('un authorized access')
          }
        })
        .catch((error) => {
          res.status(401).send('un authorized access')
        });
    }
    else{
      res.status(401).send('un authorized access')
    }

  })
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)