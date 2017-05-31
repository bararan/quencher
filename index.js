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
    // , flash    = require("connect-flash")
    , session = require("express-session")
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
            app.use(bodyParser.urlencoded({extended: true}));
            // app.use(flash());
            app.use(session({
                secret: "myDirtyLittleSecret",
                resave: true,
                saveUninitialized: true
            }));
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(morgan("dev"));
            app.set("port", (process.env.PORT || 5000));
            app.set("view engine", "pug");
            app.set("views", path.join(__dirname, "views"));
            app.engine("pug", pug.__express);

            passport.use(new TwitterStrategy(
                {
                    consumerKey: process.env.TWITTER_KEY,
                    consumerSecret: process.env.TWITTER_SECRET,
                    callbackURL: "/results"
                },
                function(token, tokenSecret, profile, done) {
                    db.collection("quenchUsers").findOne(function(err, user) {
                    if (err) { return done(err); }
                    done(null, user);
                    });
                }
            ));
                
            passport.serializeUser(function(user, done) {
                done(null, user.user)
            })

            passport.deserializeUser(function(user, done) {
                db.collection("quenchUsers").findOne({user: user}, function (err, user) {
                    if (err) { return done(err); }
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