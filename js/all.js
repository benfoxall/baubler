// draw the lines from the server

var data, 
width=1000,
height=7*150,
segment_width = 200,
segment_height = 150,
n=2;


// I'm sorry if this didn't work
d3.json("/data/all" + document.location.search, function(error, json) {
  if (error) return console.warn(error);
  // data = json;

  if(!data) data = [];

  // json.reverse();
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
      .attr('height', height)
      .attr('viewBox', "0 0 "+width+" "+height)
      .style('max-width','100%')
      .attr('preserveAspectRatio',"xMidYMin meet")

var line = d3.svg.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; })
    .interpolate('basis');

var lines = svg
    .selectAll('path')


// the dimensions of the grid
var grid_w = 5;

function viz(){

  if(data.length > 50){
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
    .attr("transform", function(d,i){
      var x = (i%grid_w);
      var y = (i - x) / grid_w;
      return "translate(" + segment_width*x + ","+segment_height*y+")"
    });
}




// pagination


d3.json("/data/count", function(error, json) {
  var pages = d3.select('#pages');

  // whatever
  var pageCount = Math.ceil(json.count / 35);
  var data = [];
  for (var i = 0; i < pageCount; i++) {
    data.push(i+1);
  };

  console.log(data, pageCount);

  pages.selectAll('a')
    .data(data)
    .enter()
    .append('a')
    .text(function(d,i){return d})
    .attr('href', function(d,i){
      return '?page=' + d;
    })


})