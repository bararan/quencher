//@ts-check
"use strict";

module.exports = function(app,db, passport, yelpClient) {
    let businessId = "";
    app.get("/", function(req, res) {
        if (req.user) {
            let sessionBusinesses = req.session.results.map(function(bus) {
                return bus.id;
            })
            db.collection("quencherBusinesses").find(
                {
                    id: {$in: sessionBusinesses}
                },
                {
                    _id: 0,
                    id: 1,
                    going: 1
                }
            ).toArray(function(err, businesses) {
                if (err) return console.error(err);
                businesses.forEach(function(business) {
                    let sessionBusiness = req.session.results.find(function(bus) {
                        return bus.id == business.id;
                    })
                    sessionBusiness.userGoing = business.going.indexOf(req.user.user_id) > -1;
                    sessionBusiness.countGoing = business.going.length;
                })
                const city = req.session.city;
                const results = req.session.results;
                res.render("index", {city: city, results: results})
            });
            return;               
        }
        const city = req.session.city || false;
        const results = req.session.results || false;
        if (results) console.log(results.length)
        res.render("index", {city: city, results: results});
    })

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", { successRedirect: "/login",
                                           failureRedirect: "/" }));

    // app.get("/auth/twitter/callback", function(req, res, next) {
    //     passport.authenticate("twitter", function(err, user, info) {
    //         if (err) {
    //             console.error(err);
    //             return res.render("/");
    //         }
    //         if (!user) {
    //             return res.render("/");
    //         }
    //         req.login(user, function(err) {
    //             if (err) {
    //                 console.error(err);
    //                 res.render("/");
    //             }
    //             const redirLink = "/addme/" + req.session.businessId; //req.flash("businessId");
    //             console.log("REDIRECTING: " + redirLink)
    //             return res.redirect(redirLink);
    //         })
    //     })(req, res, next)
    //     // const successLink = "/addme/" + req.session.businessId; //req.flash("businessId");
    //     // console.log("REDIRECTING TO " + successLink)
    //     // passport.authenticate("twitter", { successRedirect: successLink,
    //     //                                    failureRedirect: "/" })(req, res, next);
    // });

    app.post("/search", function(req, res) {
        const searchRequest = {
            term: 'bars',
            location: req.body.city,
            limit: 50
        };
        yelpClient.search(searchRequest)
            .then(function(response) {
                req.session.city = req.body.city;
                req.session.results = response.jsonBody.businesses.map(function(bus) {
                    return {
                        name: bus.name,
                        url: bus.url,
                        image_url: bus.image_url,
                        id: bus.id,
                        rating: bus.rating,
                        userGoing: false,
                        countGoing: 0
                    }
                })
                return res.redirect("/")
            })
            .catch(function(err) {
                console.error("YELP QUERY FAILED!");
            });
    })

    // app.post("/addme", function(req, res) {
    //     // req.session.businessId = req.body.businessId;
    //     if (!req.user) {
    //         return res.redirect("/auth/twitter");
    //     }
    //     // req.session.businessId = req.body.businessId;
    //     return res.redirect("/addme");
    // })

    app.post("/removeme", function(req, res) {
        // req.session.businessId = req.body.businessId;
        db.collection("quencherBusinesses").findOneAndUpdate(
            {id: req.body.businessId},
            {
                $pull: {going: req.user.user_id}
            },
            {
                returnOriginal: false
            },
            function(err, response) {
                if (err) return console.error(err);
                // let business = req.session.results.find(function(bus) {
                //     return bus.id == req.session.businessId;
                // })
                // business.userGoing = false;
                return res.redirect("/");
            }
        )
    })

    // app.get("/addme", function(req, res) {
    //     // let sessionBusinesses = req.session.results.map(function(bus) {
    //     //     return bus.id;
    //     // })
    //     // db.collection("quencherBusinesses").find(
    //     //     {
    //     //         id: {$in: sessionBusinesses}
    //     //     },
    //     //     {
    //     //         _id: 0,
    //     //         id: 1,
    //     //         going: 1
    //     //     }
    //     // ).toArray(function(err, businesses) {
    //     //     if (err) return console.error(err);
    //     //     businesses.forEach(function(business) {
    //     //         let sessionBusiness = req.session.results.find(function(bus) {
    //     //             return bus.id == business.id;
    //     //         })
    //     //         sessionBusiness.userGoing = business.going.indexOf(req.user.user_id) > -1;
    //     //     })
    //     // });
    //     db.collection("quencherBusinesses").findOneAndUpdate(
    //         {id: req.session.businessId},
    //         {
    //             $addToSet: {going: req.user.user_id}
    //         },
    //         {
    //             returnOriginal: false,
    //             upsert: true
    //         },
    //         function(err, response) {
    //             if (err) return console.error(err);
    //             // let business = req.session.results.find(function(bus) {
    //             //     return bus.id == req.session.businessId;
    //             // })
    //             // business.userGoing = true;
    //             return res.redirect("/");
    //         }
    //     )
    // })

    app.get("/login", function(req, res) {
        return res.redirect("/addme/" + req.session.businessId);
    })

    app.get("/addme/:businessId", function(req, res) {
        if (req.params.businessId != "undefined") {
            req.session.businessId = req.params.businessId;
            console.log("Business ID Updated: " + req.session.businessId)
        }
        if (!req.user) {
            return res.redirect("/auth/twitter");
        }
        console.log(req.session.businessId)
        db.collection("quencherBusinesses").findOneAndUpdate(
            {id: req.session.businessId},
            {
                $addToSet: {going: req.user.user_id}
            },
            {
                returnOriginal: false,
                upsert: true
            },
            function(err, response) {
                if (err) return console.error(err);
                return res.redirect("/");
            }
        )
    })
}