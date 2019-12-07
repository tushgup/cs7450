var width = 1000;
var height = 1000;
var current_dataset = [];
var tagsSet = new Set(Object.keys(color_tags_mapping));
var tagsSetAll = new Set(tagsSet);
var details_companies;

var packLayout = d3.pack()
  .size([width, height]);

var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

Promise.all([d3.csv("./data/date_notnull_circle_pack.csv"),  d3.json("./data/details.json") ]).then(function(dataset){
  current_dataset.push(dataset[0]);
  details_companies = dataset[1];
  circlepack.generateCirclePack(current_dataset[0]);
});

class circlepack{
    static clearDetails(){
      $("#companyName-acquisition").html("&nbsp;");
      $("#companydescription-acquisition").html("&nbsp;");
    }

    static addTag(tag) {
        tagsSet.add(tag)
        circlepack.clear();
        circlepack.generateCirclePack(current_dataset[0]);
    }

    static resetTag() {
        tagsSet = new Set(tagsSetAll)
        circlepack.clear();
        circlepack.generateCirclePack(current_dataset[0]);
    }

    static clearTag() {
        tagsSet = new Set()
        circlepack.clear();
        circlepack.generateCirclePack(current_dataset[0]);
    }

    static removeTag(tag) {
        tagsSet.delete(tag)
        circlepack.clear();
        circlepack.generateCirclePack(current_dataset[0]);
    }

    static clear(){
      //Make radio buttons visible
      $("#acquisition_circlepack").empty();
    }

    static generateCirclePack(dataset){

      var format = d3.format(",d");

      var data = dataset;

      data = data.filter(function(d) {
        //Turn string to array of tags
        var tags = d['major_tags'];
        tags = tags.replace('[','');
        tags = tags.replace(']','');
        tags = tags.replace(/'/g,'');
        tags = tags.split(',');

        //Check if tags set has that value
        for (var i = 0; i < tags.length; i++){
          if(tagsSet.has(tags[i])){
            return d;
          }
        }

        //return d;
        // var year_string = year.toString();
        // var sub_year_string = year_string.substring(2,4);
        // if(d['displayName'] == companyName && d['startDate'].includes(sub_year_string)){
        //   return d;
        // }
      });

      console.log(data);

      var nest = d3.nest()
                   .key(function(d) { return d.displayName; })
                   .entries(data);

      nest = {
        key: 'root',
        values: nest
      };

      var root = d3.pack()
                   .size([width, height])
                   .padding(5)
                   (d3.hierarchy(nest, function(d) {
                        return d.values;
                      }).sum(function(d) {
                        return d['stocksSummary'] === undefined ? null : d['stocksSummary'];
                      }).sort(function(a,b){
                        return b['stocksSummary'] - a['stocksSummary'];
                      }))

      let focus = root;
      let view;

      const svg = d3.select("svg.circlepack_svg")
                    .append("svg")
                    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
                    .style("display", "block")
                    .style("margin", "0 -14px")
                    .style("background", color(0))
                    .style("cursor", "pointer")
                    .on("click", () => zoom(root));

      const node = svg.append("g")
                      .selectAll("circle")
                      .data(root.descendants().slice(1))
                      .join("circle")
                      .attr("fill", d => d.children ? color(d.depth) : "white")
                      .on("mouseover", function(d) { 
                        //Search initial data in details.json for parent companies
                        if(d.parent === root){
                          $("#companyName-acquisition").html(d.data.key);
                          const f = details_companies.find(v => v && v.displayName === d.data.key)
                          if (f) {
                            $("#companydescription-acquisition").html(f.longDescription);
                          } else {
                            $("#companydescription-acquisition").html(`N/A`);
                          }
                        } 
                        //Check in dataset for circle packing
                        else {
                          $("#companyName-acquisition").html(d.data.name);
                          //const f = current_dataset[0];
                          const f = current_dataset[0].find(v => v && v.name === d.data.name)
                          if (f) {
                            if (f.description === "") {
                              $("#companydescription-acquisition").html(`N/A`);
                            } else {$("#companydescription-acquisition").html(f.description);}
                          } else {
                            $("#companydescription-acquisition").html(`N/A`);
                          }
                        }
                        d3.select(this).attr("stroke", "red").attr("stroke-width",3); 
                      })
                      .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                      .on("click", d => focus !== d && d.parent === root && (zoom(d), d3.event.stopPropagation()));

      const label = svg.append("g")
                      .style("font", "10px sans-serif")
                      .attr("pointer-events", "none")
                      .attr("text-anchor", "middle")
                      .selectAll("text")
                      .data(root.descendants())
                      .join("text")
                      .style("fill-opacity", d => d.parent === root ? 1 : 0)
                      .style("display", d => d.parent === root ? "inline" : "none")
                      .text(d =>  d.parent === root ? d.data.key : d.data.name);

      if(data.length > 0){
        zoomTo([root.x, root.y, root.r * 2]);
      }

      node.exit().remove();
      
      function zoomTo(v) {
        const k = width / v[2];

        view = v;
        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
      }

      function zoom(d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
              const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
              return t => zoomTo(i(t));
            });

        label
          .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
          .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
      }
    }
}

d3.selectAll(".acquisition_legend_shape").each(function (d) {
  const attribute = this.getAttribute("data-checkbox")
  const f = color_tags_mapping[attribute]
  //ScatterPlotUtility.mapToFormat(d3.select(this), f)
})

d3.selectAll(".acquisition_checkbox_svg").append("rect")
  .attr("width", 100)
  .attr("height", 100)
  .attr("fill", "white")
  .attr("stroke-width", 25)
  .attr("stroke", "white")
  .on("click", function (d) {
    const attribute = this.parentElement.dataset.checkbox

    const selected = d3.select(this).attr("fill") === "white"

    d3.select(this).attr("fill", selected ? "black" : "white")
    if (attribute === "All") {
      d3.selectAll(".acquisition_checkbox_svg")
        .selectAll("rect")
        .attr("fill", selected ? "black" : "white")
      if (selected)
        circlepack.clearTag()
      else
        circlepack.resetTag()
      return
    }

    if (selected)
      circlepack.removeTag(attribute)
    else
      circlepack.addTag(attribute)

  })

