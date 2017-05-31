//@ts-check
"use strict";

module.exports = function(app,db, passport, yelpClient) {
    app.get("/", function(req, res) {
        res.render("index");
    })

    app.get("*", function(req, res) {
        return res.redirect("/");
    })

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", { successRedirect: "/results",
                                            failureRedirect: "/" }));

    app.post("/search", function(req, res) {
        const searchRequest = {
            term: 'bars',
            location: req.body.city,
            limit: 50
        };
        yelpClient.search(searchRequest)
            .then(function(response) {
                // console.log(JSON.stringify(response.jsonBody.businesses[0]));
                return res.render("index", {results: response.jsonBody.businesses});
            })
            .catch(function(err) {
                console.log(err);
            });
    })
}