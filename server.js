var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000;

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);


var wss = new WebSocketServer({server: server});
console.log('websocket server created');
wss.on('connection', function(ws) {
    // var id = setInterval(function() {
    //     // ws.send(JSON.stringify(new Date()), function() {  });

    //     var msg = [0,0,0,0].map(function(){return Math.floor(Math.random()*500)});
    //     ws.send(msg.join(','));
    // }, 10);

    console.log('websocket connection open');

    ws.on('close', function() {
        console.log('websocket connection close');
        // clearInterval(id);
    });

    ws.on('message', function(data){
      // todo - don't echo back here
      for(var i in wss.clients)
        wss.clients[i].send(data);
    })



});




// wss.broadcast = function(data) {
//     for(var i in this.clients)
//         this.clients[i].send(data);
// };