// DEPENDECIES
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");



// SCRAPER
var express = require("express");
var cheerio = require("cheerio");

// MODELS 
var db = require("./models");


var PORT = process.env.port || 3000;

// INIT EXPRESS
var app = express();


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

var exphbrs = require("express-handlebars");

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/news_db");


// Routes


// index
app.get("/", function (req, res) {
    res.redirect("/articles");
});


// get request to scrape NYT website
app.get("/scrape", function (req, res) {

    var url = "https://www.nytimes.com/";

    request(url, function (error, response, html) {
        var $ = cheerio.load(html);
        var titlesArray = [];
        $("article h2").each(function (i, element) {
            var result = {};

            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            titlesArray.push(result.title);

            var entry = new Article(result);

            entry.save(function (err, data) {
                if (err) throw err;
                console.log(data);
            });

            db.Article.create(result)
                .then(function (data) {
                    console.log(data);
                })
                .catch(function (err) {
                    return res.json(err);
                });
        });
        res.send("Scrape Complete");
        res.redirect("/");
    });

});



app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (data) {
            res.json(data);
            // res.render("index", { article: data });
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (data) {
            return db.Article.findOneAndUpdate({ _id: req.params.id },
               {$push: { note: data._id }}, { new: true });
        })
        .then(function (data) {
            res.json(data);
            res.redirect(req.params.id);
        })
        .catch(function (err) {
            res.json(err);
        });
});


app.get("/delete/:id", function(req,res){
    db.Note.remove({_id: req.params.id})
    .then(function(data){
        res.redirect("/");
    })
    .catch(function(err){
        res.json(err);
    });
});



app.get("/clearAll", function (req, res) {
    db.Article.remove(req.body)
        .then(function (data) {
            res.redirect("/");
        })
        .catch(function (err) {
            res.json(err);
        });
});


app.listen(PORT, function () {
    console.log(PORT);
});