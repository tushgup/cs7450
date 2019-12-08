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

		//Remove all 0 values from data
		var newdata = [];
		for(var i = 0; i < data.length; i++){
			if(data[i]['value'] > 0){
				newdata.push(data[i]);
			}
		}

		//Sort the data into descending order
		newdata = newdata.sort(function(a,b) { return b.value - a.value; })

		var margin = {
	        top: 50,
	        right: 50,
	        bottom: 50,
	        left: 20
	    };

		//Make svg for the ethnicity bar chart
		var svg = d3.select("#ethnicity_viz")
					.append("svg")
      				.attr("viewBox", [0, 0, width, height])
      				.append("g")
			        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");;

	    var chart_width = width - margin.left - margin.right;
    	var chart_height = height - margin.top - margin.bottom;

      	var x_scale = d3.scaleLinear()
      					.domain([0, d3.max(newdata, d=> d['value'])])
          				.range([0, chart_width]);

	    var y_scale = d3.scaleBand()
	    				.domain(newdata.map(function(d) { 
	    					return d.name; 
	    				}))
	        			.range([0, chart_height])
	        			.paddingInner(0.1);

	    var yAxis = d3.axisLeft(y_scale)
	    			  .tickSize(0);

	    var axis_left = svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

        axis_left.selectAll("text")
    		.style("fill", "none")
    		// .style("text-anchor","end")
    		// .style("font-size", "20pt");

    	axis_left.selectAll("path")
    		.style("stroke", "none");

	    var rects = svg.selectAll(".bar")
	      			  .data(newdata); 

	    //Exit part
		rects.exit().remove();

		newdata = newdata.sort(function(a,b) { return b.value - a.value; })

	    //Enter & update part
	    rects.enter()
	      	 .append("rect")
	      	 .merge(rects)
	         .attr("class", "bar")
	         .attr("x", 0)
	         .attr("y", d => y_scale(d['name']))
	         .style('width', function(d){
	         	console.log(d);
            	 return x_scale(d['value']);
        	 })
	         .attr("height", y_scale.bandwidth())
	         .style("fill", "steelblue");               
	      
	    //Labels to show percentage of bars
	    var texts = svg.selectAll(".label")
	    			   .data(newdata);
	  
	  	// svgContainer.selectAll(".text")  		
				//     .data(data)
				//     .enter()
				//     .append("text")
				//     .attr("class","label")
				//     .attr("x", (function(d) { return xScale(d.food) + xScale.rangeBand() / 2 ; }  ))
				//   .attr("y", function(d) { return yScale(d.quantity) + 1; })
				//   .attr("dy", ".75em")
				//   .text(function(d) { return d.quantity; });   	

	    texts.enter().append("text")
	         .attr("class", "label")
	         .attr("x", 5)
	         .attr("y", function(d) { 
	         	console.log(d);
	         	return y_scale(d['name']) + y_scale.bandwidth()/2; 
	         })
	         .attr("dy", ".75em")
	         .text( d=> d['name'])
	         .style("fill", "#FFFFFF")
	         .style("font-size", "20pt")
	         .style("font-family", "sans-serif");  
	}
}