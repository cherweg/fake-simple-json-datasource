var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
var fs = require('fs');
var app = express();

app.use(bodyParser.json());

var loadTime = new Date().getTime();
var timeserie = require('./series.json');
var annotations = require('./annotaions.json');
var table = require('./tables.json');

watch('timeserie','./series.json');
watch('annotations','./annotaions.json');
watch('table','./table.json');

function watch(names,file){
fs.watchFile(file, function(curr, prev) {
  if (curr.mtime.getTime() > loadTime) {
    delete require.cache[require.resolve(file)];
    eval(names  + " = require(file);");
    //global[names].value = require(file);
    console.log(names);
    console.log("Ohh..there was a change");
  } else {
    return file
  }
});
}

function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "accept, content-type");  
}


app.all('/', function(req, res) {
  setCORSHeaders(res);
  res.send('I have a quest for you!');
  res.end();
});

app.all('/search', function(req, res){
  setCORSHeaders(res);
  var result = [];
  _.each(timeserie, function(ts) {
    result.push(ts.target);
  });

  res.json(result);
  res.end();
});

app.all('/annotations', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  var tsResult = [];
  _.each(req.body.annotation.query, function(query) {
      var k = _.filter(annotations, function(q) {
        return q.tags === query.tags;
      });

      _.each(k, function(kk) {
        tsResult.push(kk)
      });
  });

  res.json(tsResult);
  res.end();
})

app.all('/query', function(req, res){
  setCORSHeaders(res);
  console.log('got a query');
  console.log(req.url);
  console.log(req.body);

  var tsResult = [];
  _.each(req.body.targets, function(target) {
    if (target.type === 'table') {
      tsResult.push(table);
    } else {
      var k = _.filter(timeserie, function(t) {
        return t.target === target.target;
      });

      _.each(k, function(kk) {
        tsResult.push(kk)
      });
    }
  });

  res.json(tsResult);
  res.end();
});

app.listen(3333);

console.log("Server is listening to port 3333");
