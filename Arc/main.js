var svg = d3.select('svg');
var width = +svg.attr('width');
var height = +svg.attr('height');
const pi = Math.PI

var arcGroup;
var colorScale = d3.scaleOrdinal(d3.schemeTableau10);
var linkScale = d3.scaleSqrt().range([1,5]);
var collisionForce = d3.forceCollide(12).strength(1).iterations(100);

var simulation = d3.forceSimulation()
	.force('link', d3.forceLink().id(function (d) { return d.id; }).strength(0))
	.force('x', d3.forceX().x(function(node) {
		let x = 0
		let count = 0
		node.tags.forEach((v) => {
			const h = arcData.find(((a) => a.label == v))
			if (!h) return
			x += h.centroid[0] * 0.8
			count += 1
		})
		return x / count
	})).force('y', d3.forceY().y(function (node) {
		let y = 0
		let count = 0
		node.tags.forEach((v) => {
			const h = arcData.find(((a) => a.label == v))
			if (!h) return
			y += h.centroid[1] * 0.8
			count += 1
		})
		return y / count
	})).force("collisionForce", collisionForce);


var arcData = []

var tip = d3.tip().attr('class', 'd3-tip').html((d) => d.id)

class ArcController {
	constructor(label, startAngle, endAngle, value) {
		this.label = label;
		this.startAngle = startAngle;
		this.endAngle = endAngle;
		this.value = value;
	}
}

function preprocessDataToDrawArc() {
	const nodes_with_tags = network["nodes"].filter(item => "tags" in item)
	const link_with_tags = network["links"].filter(item => {
		const n1 = nodes_with_tags.find(object => object['id'] === item['source']);
		const n2 = nodes_with_tags.find(object => object['id'] === item['target']);
		return n1 && n2
	})
	network["links"] = link_with_tags
	network["nodes"] = Array.from(new Set(_(link_with_tags)
	.flatMap(i => [i.source, i.target])
	.value())).map(i => { return { "id": i } });

	network["nodes"].forEach((v) => {
		const n1 = nodes_with_tags.find(object => object['id'] === v['id'])
		v["tags"] = eval(n1["tags"])
	})

	const tags_counter = _(network["nodes"]).flatMap(i => eval(i.tags))
		.filter((i) => i.charAt(0) === i.charAt(0).toUpperCase()).countBy().value()

	const tags_sum = Object.values(tags_counter).reduce((a, b) => a + b, 0)
	let startAngle = 0
	const granul = 360 / tags_sum
	for (const [key, value] of Object.entries(tags_counter)) {
		const degree = pi / 180 * granul * value
		arcData.push({ "label": key, "startAngle": startAngle, "endAngle": startAngle + degree, "value": value })
		startAngle += degree
	}
}

function drawArcs() {

	arcGroup = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	let arcGenerator = d3.arc()
	.innerRadius(230)
	.outerRadius(240)

	arcGroup.selectAll('path')
	.data(arcData)
	.enter()
	.append('path')
	.attr('d', arcGenerator)
	.attr('fill', "aliceblue")
	.attr('stroke', 'black')
	.each(function (d) {
		d["arcElement"] = this
	})


	arcGroup.selectAll('text')
	.data(arcData)
	.enter()
	.append('text')
	.each(function (d) {
		var centroid = arcGenerator.centroid(d);
		d["textElement"] = this
		d["centroid"] = centroid

		d3.select(this)
			.attr('x', centroid[0] * 1.1)
			.attr('y', centroid[1] * 1.1)
			.attr('dy', '0.33em')
			.attr("text-anchor",
			(d.startAngle > pi) ? "end" : "start"
			)
			.attr("visibility", "hidden")
			.text(d.label);

	});
}

d3.json('consumer_g_network.json').then(function(dataset) {
	network = dataset;
	console.log(network);
	preprocessDataToDrawArc()
	drawArcs()


	linkScale.domain(d3.extent(network.links, function(d){ return d.value;}));

	var linkG = arcGroup.append('g')
	    .attr('class', 'links-group');

	var nodeG = arcGroup.append('g')
	.attr('class', 'nodes-group');

	var linkEnter = linkG.selectAll('.link')
					    .data(network.links)
					    .enter()
					    .append('line')
						.attr('class', 'link')
						.attr('visibility', 'hidden')
					    .attr('stroke-width', function(d) {
					        return linkScale(5);
					    }).each(function (d) {
							d["linkElement"] = this
						});

	var nodeEnter = nodeG.selectAll('.node')
	.data(network.nodes)
	.enter()
	.append('g')

	nodeEnter.append('circle')
	.attr('class', 'node')
	.attr('r', 6)
	.style('fill-opacity', 0.5)
	.on('mouseover', mouseovernode)
	.on('mouseout', mouseoutnode)


	nodeEnter.append('text')
	.attr("text-anchor", "middle")
	.attr("y", -10)
	.attr("visibility", "hidden")
	.text((d) => d.id)
	.each(function(d) {
		d["textElement"] = this
	})


	function tickSimulation() {
		linkEnter
			.attr('x1', function(d) { return d.source.x;})
			.attr('y1', function(d) { return d.source.y;})
			.attr('x2', function(d) { return d.target.x;})
			.attr('y2', function(d) { return d.target.y;});

		nodeEnter
		.attr("transform", d => "translate(" + d.x + "," + d.y + ")")
	}


	simulation
	.nodes(network.nodes)
	.on('tick', tickSimulation);

	simulation
	    .force('link')
		.links(network.links);
});


function resetAllElement() {
	arcData.forEach((a) => {
		a.arcElement.setAttribute("fill", "aliceblue")
		a.textElement.setAttribute("visibility", "hidden")
	})

	network["links"].forEach(v => {
		v.linkElement.setAttribute("visibility", "hidden")
	})
}


function mouseovernode(d, i) {
	d.tags.forEach((v) => {
		const h = arcData.find(((a) => a.label == v))
		if (!h) return
		h.arcElement.setAttribute("fill", "lightpink")
		h.textElement.setAttribute("visibility", "visible")
	})

	network["links"].filter(item => {
		return d["id"] === item.source.id || d.id === item.target.id
	}).forEach(v => v.linkElement.setAttribute("visibility", "visible"))

	Array.from(new Set(_(network["links"]).filter(item => {
		return d["id"] === item.source.id || d.id === item.target.id
	}).flatMap(d => [d.source, d.target]).value())).forEach((v) => {
		v.textElement.setAttribute("visibility", "visible")
	})
}

function mouseoutnode(d, i) {
	resetAllElement()
	Array.from(new Set(_(network["links"]).filter(item => {
		return d["id"] === item.source.id || d.id === item.target.id
	}).flatMap(d => [d.source, d.target]).value())).forEach((v) => {
		v.textElement.setAttribute("visibility", "hidden")
	})
}
