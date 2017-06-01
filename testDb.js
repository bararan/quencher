
require("dotenv").config();

const client = require("mongodb").MongoClient;
// const url = 'mongodb://localhost:27017/connect_mongodb_session_test';
const url = "mongodb://" + process.env.DBUSR + ":" + process.env.DBPW + "@" + process.env.DB_URI;
client.connect(url,
    function(err, db) {
        if (err) console.log(err);
        db.collection("quencherSessions").find({}).toArray(
            function(err, docs) {
                console.log(JSON.stringify(docs[0]))
            })
    db.close();
    })
