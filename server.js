var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000
  , redis_url = process.env.REDISTOGO_URL && process.env.REDISTOGO_URL.replace('redistogo', '')
  , redis_sub = require('redis-url').connect(redis_url)
  , redis_pub = require('redis-url').connect(redis_url);


app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);


var wss = new WebSocketServer({server: server});
console.log('websocket server created');
wss.on('connection', function(ws) {

    console.log('websocket connection open');

    ws.on('close', function() {
        console.log('websocket connection close');
        // clearInterval(id);
    });

    ws.on('message', function(data){
      // todo - check format of message
      redis_pub.publish('draws', data)
    })



});

redis_sub.on("message", function (channel, message) {
    console.log("client1 channel " + channel + ": ", message);
    // send out to all clients on this node
    // todo - don't echo to emitting node
    for(var i in wss.clients)
        wss.clients[i].send(message);
});

redis_sub.subscribe("draws");
