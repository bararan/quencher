//@ts-check
"use strict";

module.exports = function(app,db, passport, yelpClient) {
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
        res.render("index", {city: city, results: results});
    })

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", { successRedirect: "/addme",
                                           failureRedirect: "/" }));

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
                console.error("YELP KAPUT!");
            });
    })

    app.post("/addme", function(req, res) {
        req.session.businessId = req.body.businessId;
        if (!req.user) {
            return res.redirect("/auth/twitter");
        }
        return res.redirect("/addme");
    })

    app.post("/removeme", function(req, res) {
        req.session.businessId = req.body.businessId;
        db.collection("quencherBusinesses").findOneAndUpdate(
            {id: req.session.businessId},
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

    app.get("/addme", function(req, res) {
        // let sessionBusinesses = req.session.results.map(function(bus) {
        //     return bus.id;
        // })
        // db.collection("quencherBusinesses").find(
        //     {
        //         id: {$in: sessionBusinesses}
        //     },
        //     {
        //         _id: 0,
        //         id: 1,
        //         going: 1
        //     }
        // ).toArray(function(err, businesses) {
        //     if (err) return console.error(err);
        //     businesses.forEach(function(business) {
        //         let sessionBusiness = req.session.results.find(function(bus) {
        //             return bus.id == business.id;
        //         })
        //         sessionBusiness.userGoing = business.going.indexOf(req.user.user_id) > -1;
        //     })
        // });
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
                // let business = req.session.results.find(function(bus) {
                //     return bus.id == req.session.businessId;
                // })
                // business.userGoing = true;
                return res.redirect("/");
            }
        )
    })
}