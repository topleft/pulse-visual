
(function(){

  'use strict';

  var nio = require('niojs');
  var d3 = require('d3');

  window.initPulse = initPulse;

  var prevAvg;
  var currentAvg;
  var counts = [];
  var sampleSize = 3;

  function initPulse (colors) {
    console.log("** pulse initiated **");

    nio.source.socketio(
    'http://brand.nioinstances.com',
    ['count_by_time']
    ).pipe(nio.func(grabCounts));

    var time = sampleSize*1000;  
    
    setInterval(function() {
    if (counts.length > sampleSize) {
      var color = runColorPicker();
    } else {
      var color = '#D4B14C';
    }
    d3.select("circle")
      .transition()
        .duration(time*0.5)
          .style("fill", d3.hcl(color))
      .transition()
        .duration(time*0.6)
        .style("fill", function() {
          var that = d3.select(this),
              fill0 = that.style("fill"),
              fill1 = that.style("fill", null).style("fill");
          that.style("fill", fill0);
          return fill1;
        });
    }, time);  
  }


  function grabCounts (chunk) {
    if (chunk.count_type === 'countpersec') {
        counts.push(chunk.count_value);
    }
  }  


  function runColorPicker () {
    averagePerSecCount();
    var diff = calcDifference();
    var color = determineColor(diff, colors);
    return color;
  }


  function averagePerSecCount () {    
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
  }


  function determineColor (diff, colors) {
    if (diff > 5) {
      return colors.high;
    } else if (diff < -5) {
      return colors.low;
    } else {
      return colors.middle;
    }
  }


  function calcDifference () {
    if ( !prevAvg ) { 
      prevAvg = currentAvg;
      return;
    }
    var diff = prevAvg - currentAvg;
    prevAvg = currentAvg;
    $('#data span')
        .html(Math.round(diff));
    return Math.round(diff);
  }


})();
