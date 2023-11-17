var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile('index.html', { root: __dirname + "/public" } );
});

http.listen(3000, function(){
   console.log('listening on http://localhost:3000/');
});