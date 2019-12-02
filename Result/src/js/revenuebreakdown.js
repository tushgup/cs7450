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

			treemap.updateChart(filteredData);
		});
	}

	static updateChart(data){
		//Get type of segment to make the treemap for revenue breakdown.
		var segments = document.getElementsByName("breakdown_segment");
		var segment_chosen;
		for (var i = 0; i < segments.length; i++) {
		  if (segments[i].checked) {
		    segment_chosen = segments[i].value;
		  }
		}

		//Filter the data according to the segment
		var filteredData = data.filter(function(d) {
			if(d['segmentCategory'] == segment_chosen){
				return d;
			}
		});

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
			var u = d3.select('svg.treemap_svg')
				.selectAll('g.node')
				.data(nodes);

			var nodes = u.enter()
				.append('g')
				.classed('node', true);

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
				.style("fill", function(d){ return 'white';})
				.attr("stroke", "black")
				.attr("stroke-width",3)
				.attr('height', function(d) {
					return d.y1 - d.y0;
				});

			nodes.append('text')
				.attr('x', function(d) {
					return d.depth === 3 ? 0.5 * (d.x0 + d.x1) : d.x0 + 3;
				})
				.attr('y', function(d) {
					return d.depth === 3 ? 0.5 * (d.y0 + d.y1) : d.y0 + 6;
				})
				.each(function(d) {
					var label = d.depth === 0 ? '' : d.depth === 2 ? format(d.data.value) : d.data.key;
					if(typeof label !== 'undefined'){
						d3.select(this)
					    .text(label)
						.style('font-size', d3.min([1.4 * (d.x1 - d.x0) / label.length, 11]))
						.style('display', (d.x1 - d.x0) < 10 || (d.y0 - d.y1) < 10);
					}
				})
				.style('text-anchor', function(d) {
					return d.depth === 3 ? 'middle' : 'start';
				})
				.attr('dy', '0.3em');

			u.exit().remove();
		}

		treemapLayout(root);
		make(root);
	}
}