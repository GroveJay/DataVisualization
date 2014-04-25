var body = {width: $("body").width(), height: $("body").height()};

var species = ["male", "female"],
    traits = ["Age", "Communication", "Employment", "Time at Residence (Months)", "Education", "Gender", "Marital Status"];

var m = 55,
    w = body.width - m;
    h = body.height;

var x = d3.scale.ordinal().domain(traits).rangePoints([m, w]),
    y = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    foreground;

var svg = d3.select("body").append("svg:svg")
    .style("width", "100%")
    .style("height", "100%")
    .style("position", "fixed")
    .style("bottom", 0);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    console.log(this);
  return "<strong>Frequency:</strong> <span style='color:red'>" + d.Gender + "</span>";
});

svg.call(tip);

d3.csv("test.csv", function(flowers) {

/*    if(d === "colour") {
        y[d] = d3.scale.ordinal()
          .domain(cars.map(function(p) { return p[d]; }))
          .rangePoints([h, 0]);

    }*/

  // Create a scale and brush for each trait.
  traits.forEach(function(d) {
    // Coerce values to numbers.
    flowers.forEach(function(p) { 
      //console.log(p);
      //p[d] = +p[d];
    });
    if(isNaN(flowers[0][d])){
      y[d] = d3.scale.ordinal()
        .domain(flowers.map(function(p) { return p[d]; }))
        .rangePoints([ h - m*2, 0]);
    }
    else{
      y[d] = d3.scale.linear()
        .domain(d3.extent(flowers, function(p) { return p[d]; }))
        .range([h - m*2, 0]);
    }

    y[d].brush = d3.svg.brush()
        .y(y[d])
        .on("brush", brush);
 });

  /*// Add a legend.
  var legend = svg.selectAll("g.legend")
      .data(species)
    .enter().append("svg:g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(10," + (h -15 - (i * 20)) + ")"; });

  legend.append("svg:line")
      .attr("class", String)
      .attr("x2", 8);

  legend.append("svg:text")
      .attr("x", 12)
      .attr("dy", ".31em")
      .text(function(d) { return d; });*/

  var colors = d3.scale.category10();

  // Add foreground lines.
  foreground = svg.append("svg:g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(flowers)
    .enter().append("svg:path")
      .attr("d", path)
      .attr("stroke", function(d) { return colors(d.Gender); })
      .attr("class", "neutralLine")
      .attr("transform", "translate( 0, 30)")
      .on("mouseover", function(d) {
        tip.show();
        $(".line").removeClass("neutralLine").addClass("fadedLine");
        d3.select(this).classed("hoverLine", true);
      })
      .on("mouseout" , function(d) {
        tip.hide();
        d3.select(this).classed("hoverLine", false);
      });
  // Add a group element for each trait.
  var g = svg.selectAll(".trait")
      .data(traits)
    .enter().append("svg:g")
      .attr("class", "trait")
      .attr("transform", function(d) { return "translate(" + x(d) + ", 30)"; })
      .call(d3.behavior.drag()
      .origin(function(d) { return {x: x(d)}; })
      .on("dragstart", dragstart)
      .on("drag", drag)
      .on("dragend", dragend))
      .on("click", changeColors);

  // Add an axis and title.
  g.append("svg:g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("svg:text")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .attr("class", "title")
      .text(String)

  // Add a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) { d3.select(this).call(y[d].brush); })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

  function dragstart(d) {
    i = traits.indexOf(d);
    //$(".parallelFade").toggle();
  }


  function drag(d) {
    x.range()[i] = d3.event.x;
    traits.sort(function(a, b) { return x(a) - x(b); });
    g.attr("transform", function(d) { return "translate(" + x(d) + ", 30)"; });
    foreground.attr("d", path);
  }

  function dragend(d) {
    x.domain(traits).rangePoints([m, w]);
    var t = d3.transition().duration(500);
    t.selectAll(".trait").attr("transform", function(d) { return "translate(" + x(d) + ", 30)"; });
    t.selectAll(".foreground path").attr("d", path);
    //$(".parallelFade").toggle();
  }

  function changeColors(title){
    if(isNaN(flowers[0][title])){
      d3.selectAll("path")
        .attr("stroke", function(d) { return colors(d[title]); });
    }
    else{
      var max = d3.max(flowers, function(d){ return d[title]; });
      var min = d3.min(flowers, function(d){ return d[title]; });
      var gradient = d3.scale.linear()
        .domain([min, max])
        .range(["#1f77b4", "#ff7f0e"]);
      gradient()
      d3.selectAll("path")
        .attr("stroke", function(d) { return gradient(d[title]);});
    }
    d3.selectAll(".trait")
      .classed("selected", false);
    d3.select(this)
      .classed("selected", true);    
  }
});

// Returns the path for a given data point.
function path(d) {
  return line(traits.map(function(p) { return [x(p), y[p](d[p])]; }));
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = traits.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.classed("parallelFade", function(d) {
    return !actives.every(function(p, i) {
      if(isNaN(d[p])){
        return extents[i][0] <= y[p](d[p]) && y[p](d[p]) <= extents[i][1];
      }
      else{
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }
    });
  });
}
