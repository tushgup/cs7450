var width = 1000;
var height = 950;

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
		//Scale for width of bars
		var x_scale = d3.scaleLinear()
			        .domain([0, d3.max(data, d=> d['value'])])
			        .range([0, width]);

	    var rects = svg.selectAll(".bar")
	      			  .data(data.sort( (a,b) => d3.descending(a['value'], b['value'])) ); 

	    //Adapt height of bars to be based on number of data and height of svg
	    var height_of_bar = height / data.length;

	    //Exit part
		rects.exit().remove();

	    //Enter & update part
	    rects.enter()
	      	 .append("rect")
	      	 .merge(rects)
	         .attr("class", "bar")
	         .attr("x", 0)
	         .attr("y", (d,i, ds) => i*height_of_bar)
	         .style('width', function(d){
            	 return x_scale(d['value']);
        	 })
	         .attr("height", height_of_bar - 1)
	         .style("fill", "steelblue");

	    // //Update part
	    // rects.transition()
	    // 	 .duration(200)
	    // 	 .attr("x", 0)
	    // 	 .style('width', function(d){
     //        	 return x_scale(d['value']);
     //    	 })
     //    	 .attr("y", (d,i, ds) => i*height_of_bar)
     //    	 .attr("height", height_of_bar - 1)
	    //      .style("fill", "steelblue");
	      
	    //Labels to show percentage of bars
	    var texts = svg.selectAll(".label")
	    			   .data(data);
	  
	    rects.enter()
	         .append("text")
	         .attr("class", "label")
	         .attr("x", 0)
	         .attr("y", (d,i, ds) => i*height_of_bar)
	         .text( d=> d['value'] + "%")
	         .style("fill", "#000")
	         .style("font-size", "40pt")
	         .style("font-family", "sans-serif");  
	}
}