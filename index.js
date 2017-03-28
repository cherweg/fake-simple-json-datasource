var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
var fs = require('fs');
var url = require('url');
var app = express();

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

app.use(bodyParser.json({ verify: rawBodySaver }));

var loadTime = new Date().getTime();
var timeserie = require('./series.json');
var annotations = require('./annotations.json');
var table = require('./tables.json');

watch('timeserie','./series.json');
watch('annotations','./annotations.json');
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
  console.log(req.body.annotation.query);
  query_json = [];
    query_json = req.body.annotation.query.split(',').reduce(function(o,pair) {
      pair = pair.split(':');
      return o[pair[0]] = pair[1], o;
      }, {});   

  var tsResult = [];
  _.each(query_json, function(value, key, object) {
    console.log(key + "..." + value);
    var k = _.filter(annotations,function(q) {
    var search_base = eval('q.' + key);
    return search_base === value;
    });
     _.each(k, function(kk) {
        tsResult.push(kk)
     });
  });
	  
  res.json(tsResult);
  res.end();
});

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

app.use('/public', express.static(__dirname + '/public'));  
app.use(express.static(__dirname + '/public')); 

app.post('/receive', function(request, respond) {
    var body = '';
    var ondisk_data = [];
    filePath = __dirname + '/public/data.json';
    console.log(filePath);
    ondisk_data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    ondisk_data.push(request.rawBody);
    //console.log('THE DATA:' + JSON.stringify(ondisk_data));
    fs.writeFile(filePath,JSON.stringify(ondisk_data), function() {
	                respond.end();
    });
});

app.listen(3333);

console.log("Server is listening to port 3333");
