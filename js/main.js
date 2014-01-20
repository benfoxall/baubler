var viewctx = viewCanvas.getContext('2d');

var host = location.origin.replace(/^http/, 'ws'),
    ws, ws_connecting = true;

function connect(){
  ws = new WebSocket(host);
  ws.onopen = function(){
    // it's okay to try and reconnect in a second
    setTimeout(function(){
      ws_connecting = false;  
    },1000);
  }
  ws.onmessage = function (event) {
    
    var d = event.data;
    var command = d.charAt(0);
    var rest = d.substr(1);

    if(command == 'L'){
     var xyxy = rest.split(',');

      var x1 = parseInt(xyxy[0],10);
      var y1 = parseInt(xyxy[1],10);
      var x2 = parseInt(xyxy[2],10);
      var y2 = parseInt(xyxy[3],10);

      with(viewctx){
        strokeStyle = '#fff';
        fillStyle = 'rgba(0,0,0,.03)';
        fillRect(0,0,viewCanvas.width,viewCanvas.height);
        lineWidth = 2;
        beginPath();
        moveTo(x1, y1);
        lineTo(x2, y2);
        stroke();    
      }   
    }

    if(command == 'C'){
      var id = rest;
      reqwest({
        url:'/data/' + id,
        type:'json'
      })
      .then(function(resp){
        if(!data) data = [];
        data.push(process(resp.data));

        viz();
      })
    }
  };

  ws.onclose = reconnect;
  ws.onerror = reconnect;
}


var reconnect_timeout = 5000;
function reconnect(){
  if (ws.readyState === undefined || ws.readyState > 1) {
    if(!ws_connecting){
      setTimeout(connect, reconnect_timeout)
      ws_connecting = true;
      console.log("reconnecting in 5s")
    }
  }
}
connect();





var inited, alerted = false;
capture.onclick = function(){
  if(inited) return;
  inited = true;

  var prior_x, prior_y;

  var drawstate = 'none', button_size = 50, points = [];

  window.b = new Bauble({worker:'js/bauble-worker.js'})
  b.getUserMedia(function(){
    calibrate_label.style.display = captureWindow.style.display = 'block';
  })
  .attachTo('#captureWindow')
  .on('point', function(x,y){

    // b.pctx.fillStyle = 'rgba(255,255,255,0.03)';
    // b.pctx.fillRect(0,0,b.canvas.width,b.canvas.height);

    // the persistant canvas context
    with(b.pctx){

      // strokeStyle = '#ce4072';//#08f'
      strokeStyle = drawstate == 'started' ? '#ce4072' : '#000'
      lineWidth = 2;

      // strokeRect(x-3,y-3, 6,6)

      // if we have start and end points
      if(x && y && prior_x && prior_y){
        beginPath();
        moveTo(prior_x, prior_y);
        lineTo(x,y);
        stroke();

        try{
          // submit to live thing (remove if scale problems)
          var send_data = [x,y,prior_x,prior_y].map(function(d){return parseInt(d)}).join(',')
          ws.send(send_data);  

        } catch (e){
          if(!alerted){
            alerted = true;
            alert("couldn't send live data (your completed line should still get sent)")
            console.error(r)
          }
        }
        

        if(drawstate == 'started'){
          points.push(parseInt(x,10));
          points.push(parseInt(y,10));
        }
      }
                  
    }



    // update draw states
    if(x && y){
      if(x < button_size && y > b.canvas.height - button_size){
        clear();
        drawstate = 'started';
        points = [];
        // console.log(drawstate)
      }
      if(x > b.canvas.width - button_size && y > b.canvas.height - button_size){
        clear();
        // submit points
        if(drawstate === 'started'){
          if(points.length) 
            reqwest({
              method:'post',
              url:'/', 
              data:{data:points}, type:'json'
            })
          points = [];
        }

        drawstate = 'none';
      }
    }

    prior_x = x, prior_y = y;
  });


  function clear(){
    b.pctx.clearRect(0,0,b.canvas.width,b.canvas.height);
    b.pctx.fillStyle = 'rgba(255,255,255,0.7)';
    b.pctx.fillRect(0,0,b.canvas.width,b.canvas.height);


    b.pctx.fillStyle = '#08f';
    b.pctx.fillRect(0,b.canvas.height - button_size
      ,button_size,button_size);

    b.pctx.fillStyle = '#f08';
    b.pctx.fillRect(b.canvas.width - button_size,b.canvas.height - button_size
      ,button_size,button_size);
  }


  // show correct buttons
  viewArea.style.display = this.style.display = 'none';
  captureArea.style.display = 'block';

  calibrate.onchange = function(){
    b.setCalibrating(this.checked);
    clear();
  }

}


// draw the lines from the server

var data, 
width=700,
height=100,
segment_width = 100,
segment_height = 100,
n=2;

d3.json("/recent", function(error, json) {
  if (error) return console.warn(error);
  // data = json;

  if(!data) data = [];

  json.reverse();
  // pull out the drawings
  json.forEach(function(item){
    data.push(process(item.data));
  })

  viz();
});

// formats the list of points to a [x1,y1] => [[x1,y1]]
// and scales to the width of 100 (and start 0?)
function process(points){
  var xs = points.filter(function(_,i){return i%2 == 0});
  var ys = points.filter(function(_,i){return i%2 == 1});

  var x = d3.scale.linear()
          .domain([d3.min(xs), d3.max(xs)])
          .range([0,segment_width]);


  xs = xs.map(x);
  ys = ys.map(x);
  var offy = segment_height - d3.max(ys);
  ys = ys.map(function(d){return d+offy})

  return d3.zip(xs, ys);

}


var svg = 
    d3.select('#lines').append('svg')
      .attr('width', width)
      .attr('height', height);

var line = d3.svg.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; })
    .interpolate('basis');

var lines = svg
    .selectAll('path')

function viz(){

  if(data.length > 7){
    data = data.splice(data.length - 7)
  }

  var n = data.length-1;

  lines = lines.data(data);

  lines
    .enter()
    .append("path")
    .attr("class", "line")

  lines
    // .transition()
    .attr("d", line)
    .attr("transform", function(d,i){return "translate(" + segment_width*i + ",0)"});
}


