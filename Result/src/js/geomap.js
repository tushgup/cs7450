var svg = d3.select("svg.geomap_svg");
    var projection = d3.geoEqualEarth().rotate([90, 0, 0]);
    var path = d3.geoPath().projection(projection);

    var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";
    
    Promise.all([d3.json(url), d3.csv("./data/locations.csv")]).then(function(data) {
      var world = data[0];
      var points = data[1];

      var c10 = d3.scaleOrdinal(d3.schemeCategory10);

      var map = svg.append("path")
                  .attr("d", path(world))
                  .attr("fill", "lightgray")
                  .attr("stroke", "white");
      
      var circles = svg.selectAll("circle")
                      .data(points)
                      .enter()
                      .append("circle")
                      .attr("r", function(d) {
                        return 3;
                      })
                      .attr("cx", function(d) {
                        var geoJsonPoint = {
                            type: "Point",
                            coordinates: [d['longitude'],d['latitude']],
                        } 
                        return projection(geoJsonPoint.coordinates)[0];
                      })
                      .attr("cy", function(d) {
                        var geoJsonPoint = {
                            type: "Point",
                            coordinates: [d['longitude'],d['latitude']],
                        } 
                        return projection(geoJsonPoint.coordinates)[1];
                      })
                      .style("fill", function(d){ return c10(d['displayName'])})
                      .attr("opacity", 1)
                      .on("mouseover", function(d){
                          var hovered = d3.select(this);
                          console.log("REACHED");
                      })
                      .on('mouseout', function(d){ 
                          var hovered = d3.select(this);
                      });

      var labels = circles.append("text")
                        .text(function(d) { 
                          return d.displayName; 
                        })
                        .style("visibility", "hidden");
});