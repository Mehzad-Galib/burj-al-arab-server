const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 5000;

var serviceAccount = require("./configs/burj-al-arab-15625-firebase-adminsdk-fefv1-046797231b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const MongoClient = require("mongodb").MongoClient;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tqgoj.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("booking");
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          const uid = decodedToken.uid;
          console.log({uid});
          
          if(tokenEmail == queryEmail){
            bookings.find({email: queryEmail})
            .toArray((err, documents)=>{
                res.status(200).send(documents);
            })
          }   
          else{
            res.status(401).send('unauthorized access')
          }
            
        })
        .catch((error) => {
            res.status(401).send('unauthorized access')
        });
    }
    else{
        res.status(401).send('unauthorized access')
    }

  });
});

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(port);
