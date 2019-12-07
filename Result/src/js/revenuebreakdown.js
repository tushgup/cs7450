var all_dataset = [];

function format(number) {
        if (!number) return "N/A"
        let n = number
        let str = ""
        while (true) {
            if (n / 1000 >= 1) {
                n = n / 1000
                switch (str) {
                    case "":
                        str = "Thousand"
                        break;
                    case "Thousand":
                        str = "Million"
                        break
                    case "Million":
                        str = "Billion"
                        break
                    default:
                        break;
                }
            } else break
        }
        return `$${n.toFixed(1)} ${str}`
}

class treemap{
	static generateChart(companyName, year){
		Promise.all([d3.csv("./data/revenue_report.csv")]).then(function(data) {
			var dataset = data[0];

			var filteredData = dataset.filter(function(d) {
				var year_string = year.toString();
				var sub_year_string = year_string.substring(2,4);
				if(d['displayName'] == companyName && d['startDate'].includes(sub_year_string)){
					return d;
				}
			});

			//Check if filtered data is empty or not
			if(filteredData.length == 0){
				treemap.clear();
				var theDiv = document.getElementById("revenueBreakdown_viz");
				var content = document.createTextNode("Data not available for " + year.toString());
				theDiv.appendChild(content);
			} else {
				//Initial clear of div
				treemap.clear();

				all_dataset = [];
				all_dataset.push(filteredData);
				
				//Make radio buttons visible
				document.getElementById("breakdown_segment_buttons").style.display='';

				//Get type of segment to make the treemap for revenue breakdown.
				var segments = document.getElementsByName("breakdown_segment");
				var segment_chosen;
				for (var i = 0; i < segments.length; i++) {
				  if (segments[i].checked) {
				    segment_chosen = segments[i].value;
				  }
				}
				//Filter the data according to the segment
				var new_filteredData = filteredData.filter(function(d) {
					if(d['segmentCategory'] == segment_chosen){
						return d;
					}
				});
				//Check segment filtering
				if(new_filteredData.length == 0){
					$("#revenueBreakdown_viz").empty();
					var theDiv = document.getElementById("revenueBreakdown_viz");
					var content = document.createTextNode("Data not available for this segment");
					theDiv.appendChild(content);
				} else {
					treemap.updateChart(new_filteredData);
				}
			}			
		});
	}

	static onUpdateBreakdownSegment(){
		$("#revenueBreakdown_viz").empty();

		//Get type of segment to make the treemap for revenue breakdown.
		var segments = document.getElementsByName("breakdown_segment");
		var segment_chosen;
		for (var i = 0; i < segments.length; i++) {
		  if (segments[i].checked) {
		    segment_chosen = segments[i].value;
		  }
		}
		//Filter the data according to the segment
		var new_filteredData = all_dataset[0].filter(function(d) {
			if(d['segmentCategory'] == segment_chosen){
				return d;
			}
		});
		//Check segment filtering
		if(new_filteredData.length == 0){
			var theDiv = document.getElementById("revenueBreakdown_viz");
			var content = document.createTextNode("Data not available for this segment");
			theDiv.appendChild("br");
			theDiv.appendChild(content);
		} else {
			treemap.updateChart(new_filteredData);
		}
	}

	static clear(){
		//Make radio buttons visible
		document.getElementById("breakdown_segment_buttons").style.display='none';
		$("#revenueBreakdown_viz").empty();
	}

	static updateChart(data){
		//Make svg for the ethnicity bar chart
		var svg = d3.select("#revenueBreakdown_viz")
					.append("svg")
      				.attr("viewBox", [0, 0, width, height]);

      	var filteredData = data;

      	var color = d3.scaleOrdinal()
      		.domain(filteredData)
            .range(["#8CBAD1","#70D64E","#EF7087","#DDA335","#D981D5", "#C3B66B","D1A7CC","#70D3C5","#DD9692"]);

		var nest = d3.nest()
				  .key(function(d) { return d['segmentName']; })
				  .entries(filteredData);

		nest = {
			key: 'root',
			values: nest
		};

		var root = d3.hierarchy(nest, function(d) {
			return d.values;
		}).sum(function(d) {
			return d['value'] === undefined ? null : d['value'];
		});

		var treemapLayout = d3.treemap()
							.size([900, 900])
							.padding(0);

		function make(root) {
			var nodes = root.descendants();
			var u = svg.selectAll('g.node')
					.data(nodes);

			var nodes = u.enter()
				.append('g')
				.classed('node', true);

			var tool = d3.select("body").append("div").attr("class", "toolTip");

			nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			nodes.append('rect')
				.attr('x', function(d) {
					return d.x0;
				})
				.attr('y', function(d) {
					return d.y0;
				})
				.attr('width', function(d) {
					return d.x1 - d.x0;
				})
				.style("fill", function(d){ return color(d.data.segmentName);})
				.attr("stroke", "black")
				.attr("stroke-width",3)
				.attr('height', function(d) {
					return d.y1 - d.y0;
				}).on("mousemove", function (d) {
                    tool.style("left", d3.event.pageX + 10 + "px");
                    tool.style("top", d3.event.pageY - 20 + "px");
                    tool.style("display", "inline-block");
                    tool.html(d.children ? null : d.data.segmentName + "<br>" + format(d.data.value));
                }).on("mouseout", function (d) {
                    tool.style("display", "none");
                });

			// nodes.append('text')
			// 	.attr('x', function(d) {
			// 		return d.depth === 3 ? 0.5 * (d.x0 + d.x1) : d.x0 + 3;
			// 	})
			// 	.attr('y', function(d) {
			// 		return d.depth === 3 ? 0.5 * (d.y0 + d.y1) : d.y0 + 6;
			// 	})
			// 	.each(function(d) {
			// 		var label = d.depth === 0 ? '' : d.depth === 2 ? format(d.data.value) : d.data.key;
			// 		if(typeof label !== 'undefined'){
			// 			d3.select(this)
			// 		    .text(label)
			// 			.style('font-size', d3.min([1.4 * (d.x1 - d.x0) / label.length, 11]))
			// 			.style('display', (d.x1 - d.x0) < 10 || (d.y0 - d.y1) < 10);
			// 		}
			// 	})
			// 	.style('text-anchor', function(d) {
			// 		return d.depth === 3 ? 'middle' : 'start';
			// 	})
			// 	.attr('dy', '0.3em');

			u.exit().remove();
		}

		treemapLayout(root);
		make(root);
	}
}