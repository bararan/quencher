//@ts-check
"use strict";

module.exports = function(app,db, passport, yelpClient) {
    app.get("/", function(req, res) {
        const city = req.session.city || false;
        const results = req.session.results || false;
        res.render("index", {city: city, results: results});
    })

    // app.get("*", function(req, res) {
    //     return res.redirect("/");
    // })

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", { successRedirect: "/",
                                            failureRedirect: "/" }));

    app.post("/search", function(req, res) {
        const searchRequest = {
            term: 'bars',
            location: req.body.city,
            limit: 50
        };
        yelpClient.search(searchRequest)
            .then(function(response) {
                // console.log(JSON.stringify(response.jsonBody));
                req.session.city = req.body.city;
                req.session.results = response.jsonBody.businesses.map(function(bus) {
                    return {name: bus.name,
                            url: bus.url,
                            image_url: bus.image_url,
                            id: bus.id,
                            rating: bus.rating
                        }
                })
                // return res.render("index", {city: req.body.city,results: response.jsonBody.businesses});
                return res.redirect("/")
            })
            .catch(function(err) {
                console.log(err);
            });
    })

    app.get("/addremove/:businessId", function(req, res) {
        console.log("TRYING")
        if (!req.user) {
            console.log("HOWDY")
            return res.redirect("/auth/twitter");
        }
        console.log("USER HERE")
        console.log(req.user)
        res.redirect("/")
    })
}