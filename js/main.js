var nio = require('niojs');
var d3 = require('d3');

var prevAvg;
var currentAvg;
var counts = [];
var sampleSize = 3;
colors = {high: '#567238', middle: '#37A28A', low: '#76C6EB'};

// add [sampleSize] data chunks and then compare

nio.source.socketio(
  'http://brand.nioinstances.com',
  ['count_by_time']
  ).pipe(nio.func(function (chunk) {
    if (chunk.count_type === 'countpersec') {
      counts.push(chunk.count_value);
    }
  }));
 

setInterval(function() {
  if (counts.length > sampleSize) {
    var color = runColorPicker();
  } else {
    var color = '#bbb';
  }
  d3.select("circle")
    .transition()
      .duration(800)
        .style("fill", d3.hcl(color))
    .transition()
      .duration(2200)
      .style("fill", function() {
        var that = d3.select(this),
            fill0 = that.style("fill"),
            fill1 = that.style("fill", null).style("fill");
        that.style("fill", fill0);
        return fill1;
      });
}, 3000);  


function runColorPicker () {
  averagePerSecCount(counts, sampleSize);
  var diff = calcDifference();
  var color = determineColor(diff, colors);
  return color;
}


function averagePerSecCount (counts, sampleSize) {
  var l = counts.length || 0;
  if (l >= sampleSize) {
    var sample = counts.slice(0, sampleSize);
    var total = sample.reduce(function(prev, curr){
      return prev + curr;
    });
    counts.splice(0, sampleSize);
    var avg = Math.round(total/sampleSize);
    currentAvg = avg;
  }
};


function determineColor (diff, colors) {
  if (diff > 5) {
    return colors.high;
  } else if (diff < -5) {
    return colors.low;
  } else {
    return colors.middle;
  }
};


function calcDifference () {
  if ( !prevAvg ) { 
    prevAvg = currentAvg;
    return;
  }
  var diff = prevAvg - currentAvg;
  prevAvg = currentAvg;
  return Math.round(diff);
};


