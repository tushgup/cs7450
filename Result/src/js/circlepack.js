var width = 932;
var height = 932;

var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

Promise.all([d3.json("./data/parentchildcompanies.json")]).then(function(data){
  var format = d3.format(",d");

  var data = data[0];

	var root = d3.pack()
              .size([width, height])
              .padding(3)
              (d3.hierarchy(data)
                .sum(d => d.size)
                .sort((a, b) => b.size - a.size))

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
                  .attr("pointer-events", d => !d.children ? "none" : null)
                  .on("mouseover", function() { d3.select(this).attr("stroke", "red").attr("stroke-width",3); })
                  .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                  .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

	const label = svg.append("g")
                  .style("font", "10px sans-serif")
                  .attr("pointer-events", "none")
                  .attr("text-anchor", "middle")
                  .selectAll("text")
                  .data(root.descendants())
                  .join("text")
                  .style("fill-opacity", d => d.parent === root ? 1 : 0)
                  .style("display", d => d.parent === root ? "inline" : "none")
                  .text(d => d.data.name);

	zoomTo([root.x, root.y, root.r * 2]);

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
});

d3.selectAll(".acquisition_legend_shape").each(function (d) {
  const attribute = this.getAttribute("data-checkbox")
  const f = color_tags_mapping[attribute]
  ScatterPlotUtility.mapToFormat(d3.select(this), f)
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
      // if (selected)
      //   ScatterplotState.clearTag()
      // else
      //   ScatterplotState.resetTag()
      return
    }


    // if (selected)
    //   ScatterplotState.removeTag(attribute)
    // else
    //   ScatterplotState.addTag(attribute)

  })

