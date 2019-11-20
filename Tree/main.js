var svg = d3.select('svg');
var width = +svg.attr('width');
var height = +svg.attr('height');

var colorScale = d3.scaleOrdinal(d3.schemeTableau10);
var linkScale = d3.scaleSqrt().range([1,5]);

var simulation = d3.forceSimulation()
					.force('link', d3.forceLink().id(function(d) { return d.id; }))
					.force('charge', d3.forceManyBody())
					.force('center', d3.forceCenter(width / 2, height / 2));

var drag = d3.drag()
			.on('start', dragstarted)
			.on('drag', dragged)
			.on('end', dragended);

var tip = d3.tip().attr('class', 'd3-tip').html((d) => d.id)

Promise.all([d3.json('consumer_g_network.json'), d3.csv("consumer_g_competitors.csv")]).then(function(dataset) {
	network = dataset[0];

	calculateDegree(network)
	calculateGroup(network, dataset[1])

    linkScale.domain(d3.extent(network.links, function(d){ return d.value;}));

    var linkG = svg.append('g')
        .attr('class', 'links-group');

    var nodeG = svg.append('g')
        .attr('class', 'nodes-group');

    var linkEnter = linkG.selectAll('.link')
					    .data(network.links)
					    .enter()
					    .append('line')
					    .attr('class', 'link')
					    .attr('stroke-width', function(d) {
					        return linkScale(5);
					    });

    var nodeEnter = nodeG.selectAll('.node')
					    .data(network.nodes)
					    .enter()
					    .append('circle')
					    .attr('class', 'node')
					    .attr('r', (v) => v.degree)
						.style('fill-opacity', 0.5)
						// .style()
						//  function(d) {
						// 	// return colorScale(d.group);})
						.on('mouseover', tip.show)
						.on('mouseout', tip.hide)
	
	nodeEnter.call(tip)

	// var force = d3.layout.force()
	// 		    .nodes(data.nodes)
	// 		    .links(data.edges)
	// 		    .size([width, height])
	// 		    .linkDistance(200)
	// 		    .start();

	const simulationDurationInMs = 3000; // 20 seconds

	let startTime = Date.now();
	let endTime = startTime + simulationDurationInMs;

    function tickSimulation() {
	    linkEnter
	        .attr('x1', function(d) { return d.source.x;})
	        .attr('y1', function(d) { return d.source.y;})
	        .attr('x2', function(d) { return d.target.x;})
	        .attr('y2', function(d) { return d.target.y;});

	    nodeEnter
	        .attr('cx', function(d) { return d.x;})
	        .attr('cy', function(d) { return d.y;});
	}

	function onSimulationTick() {
	    if (Date.now() < endTime) {
	        tickSimulation();
	    } else {
	        simulation.stop();
	    }
	}

	simulation
	    .nodes(network.nodes)
	    .on('tick', onSimulationTick);

	simulation
	    .force('link')
	    .links(network.links);

	simulation.force("charge", d3.forceManyBody().strength(-5) );

    nodeEnter.call(drag);
});

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = d.x;
    d.fy = d.y;
}

function calculateDegree(network) {
	network["links"].forEach((item, index) => {
		let j = network["nodes"].findIndex((v) => (v.id === item["source"]))
		if (j != null) {
			if (!("degree" in network["nodes"][j]))
				network["nodes"][j]["degree"] = 0
			network["nodes"][j]["degree"] += 1
		}

		let x = network["nodes"].findIndex((v) => (v.id === item["target"]))
		if (x != null) {
			if (!("degree" in network["nodes"][x]))
				network["nodes"][x]["degree"] = 0
			network["nodes"][x]["degree"] += 1
		}
	});
}

function calculateGroup(network, competitors) {
	console.log(network)
	const compe = {}
	competitors.forEach((v) => {
		if (!("displayName_parent" in compe)) compe["displayName_parent"] = new Set()
		compe["displayName_parent"].add(v["displayName"])
	})
	const groups = []
	for (const [key, value] of Object.entries(compe)) {
		groups.push(Array.from(value) + [key])
	}
	console.log(groups)
	network["nodes"].forEach((v) => {
		groups.forEach((value, index) => {
			if (value.includes(v.id)) {
				v["group"] = index
			}
		})
	})


}