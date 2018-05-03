
'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
const GoogleImages = require('google-images');
 
const client = new GoogleImages(process.env.CX, process.env.API_KEY);

/*var urlString = `https://www.googleapis.com/customsearch/v1?key=${process.env.API_KEY}&cx=${process.env.CX}&q=lolcats`;
console.log(urlString)
http.get(urlString, function(response){
	console.log(response);
});**/

var mongodb = require('mongodb');
var collection;
// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;

mongodb.MongoClient.connect(uri, function(err, db) {
  collection = db.collection("searchStrings", function(err, res) {
    if (err) throw err;
  })
});



// Eg: https://fcc-image-search-abstraction-layer1.glitch.me/api/imagesearch/lolcats funny?offset=10
app.get('/api/imagesearch/:searchString', function (req, res, next) {
  client.search(req.params.searchString, {page: req.query.offset})
    .then(images => {
        var myImages = []
        images.forEach(image => {
            myImages.push({'url' : image.url, 'snippet' : image.description, 
                           'thumbnail' : image.thumbnail.url, 'context' : image.parentPage});
        });
        res.json(myImages);
        saveSearchString(req.params.searchString);
    })
 
})

function saveSearchString(searchString){
   var searchObj = { 'term': searchString,
	                   'when': new Date(Date.now()).toISOString() };
  
   collection.insertOne(searchObj, function(err, result) {
		      console.log('saved search');
		});
}

app.get('/api/latest/imagesearch', function (req, res) {
  collection.find({},{_id:0}).toArray( function(err,result){
        if (result) {
            res.json(result);
        } else {
            res.send(`No search records found`)
        };
	});
})
  

// Respond not found to all the wrong routes
app.use(function(req, res){
  res.status(404);
  res.type('txt').send('Not found');
});

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});
