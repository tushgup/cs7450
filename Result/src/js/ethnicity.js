var width = 1000;
var height = 1000;

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

			//If filtered data is 0, generate message to show no data available
			if(filteredData.length == 0){
				ethnicity_barchart.clear();
				var theDiv = document.getElementById("ethnicity_viz");
				var content = document.createTextNode("Data not available for " + year.toString());
				theDiv.appendChild(content);
			} else {
				ethnicity_barchart.updateChart(filteredData);
			}
		});
	}

	static clear(){
		$("#ethnicity_viz").empty();
	}

	static updateChart(data){
		//Initial clear of div
		ethnicity_barchart.clear();

		//Make svg for the ethnicity bar chart
		var svg = d3.select("#ethnicity_viz")
					.append("svg")
      				.attr("viewBox", [0, 0, width, height]);

		//Scale for width of bars
		var x_scale = d3.scaleLinear()
			        .domain([0, d3.max(data, d=> d['value'])])
			        .range([0, 900]);

	    var rects = svg.selectAll(".bar")
	      			  .data(data.sort( (a,b) => d3.descending(a['value'], b['value'])) ); 

	    //Adapt height of bars to be based on number of data and height of svg
	    var height_of_bar = 900 / data.length;

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
	         .attr("height", height_of_bar - 3)
	         .style("fill", "steelblue");
	      
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