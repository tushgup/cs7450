var width = 1000;
var height = 1000;
var radius = Math.min(width, height) / 2;

function _isContains(json, value) {
    let contains = false;
    Object.keys(json).some(key => {
        contains = typeof json[key] === 'object' ? _isContains(json[key], value) : json[key] === value;
         return contains;
    });
    return contains;
}

class gender_piechart{
	static generateChart(companyName, year){
		Promise.all([d3.csv("./data/gender.csv")]).then(function(data) {
			var dataset = data[0];
			var filteredData = dataset.filter(function(d) {
				var year_string = year.toString();
				if(d['displayName'] == companyName && d['startDate'].includes(year_string)){
					return d;
				}
			});

			//If filtered data is 0, generate message to show no data available
			if(filteredData.length == 0){
				gender_piechart.clear();
				var theDiv = document.getElementById("gender_viz");
				var content = document.createTextNode("Data not available for " + year.toString());
				theDiv.appendChild(content);
			} else {
				gender_piechart.updateChart(filteredData);
			}
		});
	}


	static clear(){
		$("#gender_viz").empty();
	}

	static updateChart(data){
		//Initial clear of div
		gender_piechart.clear();
      	
      	var color = d3.scaleOrdinal(["#66c2a5","#fc8d62","#8da0cb",
         							"#e78ac3","#a6d854","#ffd92f"]);

      	//Filter the data to make it 100%
      	var filteredData = [];
      	for(var i = 0; i < data.length; i++){
      		if(data[i].name.toLowerCase().includes("male") && !(_isContains(filteredData,"Male"))){

      			filteredData.push({"gender":"Male","value": data[i].value});
      			var female_value = 100 - data[i].value;
      			if(female_value > 0){
      				filteredData.push({"gender":"Female","value": female_value});
      			}
      		} else {
      			if(!(_isContains(filteredData,"Female"))){
      				filteredData.push({"gender":"Female","value": data[i].value});
	      			var male_value = 100 - data[i].value;
	      			if(male_value > 0){
	      				filteredData.push({"gender":"Male","value": male_value});
	      			}
      			}
      		}
      	}

      	//Make svg for the gender pie chart
		var svg = d3.select("#gender_viz")
					.append("svg")
					.attr("viewBox", [0, 0, width, height])
		        	.append("g")
		            .attr("transform", `translate(${width / 2}, ${height / 2})`);

		var pie = d3.pie()
					.value(function(d) { return Number(d.value); })(filteredData);
      
		var arc = d3.arc()
					.outerRadius(radius - 10)
					.innerRadius(0);

		var labelArc = d3.arc()
						 .outerRadius(radius - 30)
						 .innerRadius(radius - 30);

		var g = svg.selectAll("arc")
				   .data(pie)
				   .enter()
				   .append("g")
				   .attr("class", "arc");

		g.append("path")
		 .attr("d", arc)
		 .style("fill", function(d) { 
		 	if(d.data.gender == "Male"){
		 		return "#355A24";
		 	} else {
		 		return "#FDC04E";
		 	}
		 });

		g.append("text")
		 .attr("transform", function(d){
	      d.innerRadius = 0;
	      d.outerRadius = radius;
	      return "translate(" + arc.centroid(d) + ")";
	     })
		 .text(function(d) { 
		 	return  d.data.gender + " " + d.value + "%";
		 })
		 .style("fill", "#fff")
		 .attr("text-anchor", "middle")
		 .style("font-size", "40pt");
 
	}
}