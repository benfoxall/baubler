var viewctx = viewCanvas.getContext('2d');

var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
ws.onmessage = function (event) {
  document.querySelector('#pings').innerText = event.data;

  var xyxy = event.data.split(',');

  var x1 = parseInt(xyxy[0],10);
  var y1 = parseInt(xyxy[1],10);
  var x2 = parseInt(xyxy[2],10);
  var y2 = parseInt(xyxy[3],10);

  with(viewctx){
    strokeStyle = '#ce4072';
    fillStyle = 'rgba(255,255,255,0.03)';
    fillRect(0,0,viewCanvas.width,viewCanvas.height);
    beginPath();
    moveTo(x1, y1);
    lineTo(x2, y2);
    stroke();    
  }
};





var inited;
capture.onclick = function(){
  if(inited) return;
  inited = true;

  var prior_x, prior_y;

  var drawstate = 'none', button_size = 50, points = [];

  window.b = new Bauble({worker:'js/bauble-worker.js'})
  b.getUserMedia()
  .attachTo('#captureWindow')
  .on('point', function(x,y){

    // b.pctx.fillStyle = 'rgba(255,255,255,0.03)';
    // b.pctx.fillRect(0,0,b.canvas.width,b.canvas.height);

    // the persistant canvas context
    with(b.pctx){

      strokeStyle = '#ce4072';//#08f'
      lineWidth = 2;

      // strokeRect(x-3,y-3, 6,6)

      // if we have start and end points
      if(x && y && prior_x && prior_y){
        beginPath();
        moveTo(prior_x, prior_y);
        lineTo(x,y);
        stroke();

        // submit to live thing (remove if scale problems)
        var send_data = [x,y,prior_x,prior_y].map(function(d){return parseInt(d)}).join(',')
        ws.send(send_data);

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
        console.log(drawstate)
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
        console.log(drawstate)
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
