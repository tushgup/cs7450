var width = 932;
var height = 932;

var svg = d3.select('svg.ethnicity_svg')

class ethnicity_barchart{
	static generateChart(companyName, year){
		Promise.all([d3.csv("./data/ethnic.csv")]).then(function(data) {
			var dataset = data[0];
			var filteredData = dataset.filter(function(d) {
				var year_string = year.toString();
				if(d['displayName'] == companyName && d['startDate'].includes(year_string)){
					return d;
				}
			});
			console.log(filteredData);
			ethnicity_barchart.updateChart(filteredData);
		});
	}

	static updateChart(data){
		const x = d3.scaleLinear()
        .domain([0, d3.max(data, d=> d['value'])])
        .range([0, width]);

	    const rects = svg.selectAll(".bar")
	      				.data(data.sort( (a,b) => d3.descending(a['value'], b['value'])) ); 

	    rects.enter()
	      	.append("rect")
	        .attr("class", "bar")
	        .attr("x", 0)
	        .attr("y", (d,i, ds) => i*50)
	        .style('width', function(d){
            	return 'calc(' + d['value'] + '% - 3px)';
        	})
	        .attr("height", 50)
	        .style("fill", "steelblue");
	      
	    const texts = svg.selectAll(".label")
	    .data(data);
	  
	    rects.enter()
	      .append("text")
	        .attr("class", "label")
	        .attr("x", 0)
	        .attr("y", (d,i, ds) => i*10)
	    
	       // .attr("x", d => x(d.censo))
	        //.attr("y", (d) => y(d.municipio))
	        .text( d=> d['value'] + "%")
	        // .attr("width", d => x(d.censo))
	        // .attr("height", 9)
	        .style("fill", "#333")
	        .style("font-size", "6pt")
	        .style("font-family", "sans-serif");  
		}
}