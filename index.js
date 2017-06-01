//@ts-check
"use strict";
require("dotenv").config();
const express = require("express")
    , mongo = require("mongodb")
    , path = require("path")
    , pug = require("pug")
    , passport = require("passport")
    , TwitterStrategy = require("passport-twitter").Strategy
    , yelp = require('yelp-fusion')
    , morgan = require("morgan")
    , session = require("express-session")
    , MongoStore = require('connect-mongodb-session')(session)
    // , assert = require("assert")
    , bodyParser = require("body-parser")
    , quencher = require("./app/quencher"); 

const url = "mongodb://" + process.env.DBUSR + ":" + process.env.DBPW + "@" + process.env.DB_URI;
const dbClient = mongo.MongoClient;

dbClient.connect(url, function(err, db) {
    if (err) {
        throw err;
    }
    yelp.accessToken(process.env.YELP_ID, process.env.YELP_SECRET)
        .then(function(response) {
            const yelpClient = yelp.client(response.jsonBody.access_token);
            let app = express();
            app.use(express.static(path.join(__dirname, "static")));
            app.set("port", (process.env.PORT || 5000));
            app.set("view engine", "pug");
            app.set("views", path.join(__dirname, "views"));
            app.engine("pug", pug.__express);
            app.use(morgan("dev"));
            app.use(bodyParser.urlencoded({extended: true}));

            var store = new MongoStore(
                {
                    uri: url, // 'mongodb://localhost:27017/connect_mongodb_session_test',
                    collection: "quencherSessions"
            });
            store.on("error", function(err) {
                console.log("DB ERROR!: " + err)
                // assert.ifError(err);
                // assert.ok(false);
            });

            app.use(session({
                secret: "myDirtyLittleSecret",
                resave: true,
                saveUninitialized: true
                , store: store
            }));
            app.use(passport.initialize());
            app.use(passport.session());

            passport.use(new TwitterStrategy(
                {
                    consumerKey: process.env.TWITTER_KEY,
                    consumerSecret: process.env.TWITTER_SECRET,
                    callbackURL: "/auth/twitter/callback"
                },
                function(token, tokenSecret, profile, done) {
                    db.collection("quencherUsers").findOne({user_id: profile.id}, function(err, user) {
                    if (err) return done(err);
                    if (!user) {
                        const newUser = {
                            user_id: profile.id,
                            userName: profile.username,
                            displayName: profile.displayName
                        };
                        db.collection("quencherUsers").insertOne(newUser, function(err, user) {
                            if (err) return console.error(err);
                            return done(null, newUser);
                        });
                    }
                    return done(null, user);
                    });
                }
            ));
                
            passport.serializeUser(function(user, done) {
                // console.log("SSS" + JSON.stringify(user))
                done(null, user);
            })

            passport.deserializeUser(function(user, done) {
                db.collection("quencherUsers").findOne({user_id: user.user_id}, function (err, user) {
                    if (err) { return done(err); }
                    // console.log("DDD" + JSON.stringify(user))
                    done(null, user);
                });
            });

            app.listen(app.get("port"), function() {
                console.log("Node app is running on port", app.get("port"));
            });

            quencher(app, db, passport, yelpClient);
        })
        .catch(function(err) {
            console.log(err);
        })
})