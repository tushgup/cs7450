let svg = d3.select('svg');
let width = +svg.attr('width');
let height = +svg.attr('height');
const innerRadius = 200
const outerRadius = 210
let chordG;
const pi = Math.PI
let filtered;
const color = d3.scaleOrdinal(d3.schemeCategory10)

// c = {
// 	"source": {
// 		"index": 5,
// 		"subindex": 0,
// 		"startAngle": 0.05,
// 		"endAngle": 0.26436493316935994,
// 		"value": 2500000
// 	},
// 	"target": {
// 		"index": 0,
// 		"subindex": 5,
// 		"startAngle": 0,
// 		"endAngle": 0,
// 		"value": 0
// 	}
// }

function chord(matrix, padAngle, m) {
	const cos = Math.cos;
	const sin = Math.sin;
	const pi = Math.PI;
	const halfPi = pi / 2;
	const tau = pi * 2;
	const max = Math.max;
	var n = matrix.length,
		groupSums = [],
		groupIndex = d3.range(n),
		subgroupIndex = [],
		chords = [],
		groups = chords.groups = new Array(n),
		subgroups = new Array((n) * (n)),
		k,
		x,
		x0,
		dx,
		i,
		j;

	// Compute the sum.
	k = 0, i = -1;
	while (++i < n) {
		x = 0, j = -1;
		while (++j < n) {
			x += matrix[i][j];
		}
		groupSums.push(x);
		subgroupIndex.push(d3.range(n));
		k += x;
	}

	// Convert the sum to scaling factor for [0, 2pi].
	// TODO Allow start and end angle to be specified?
	// TODO Allow padding to be specified as percentage?
	k = max(0, tau - padAngle * (n - m)) / k;
	dx = k ? padAngle : tau / (n - m);

	// Compute the start and end angle for each group and subgroup.
	// Note: Opera has a bug reordering object literal properties!
	x = 0, i = - 1;
	while (++i < n) {
		x0 = x, j = -1;
		while (++j < n) {
			var di = groupIndex[i],
				dj = subgroupIndex[di][j],
				v = matrix[di][dj],
				a0 = x,
				a1 = x += v * k;
			subgroups[dj * (n) + di] = {
				index: di,
				subindex: dj,
				startAngle: a0,
				endAngle: a1,
				value: v
			};
		}

		if (groupSums[di] == 0) continue
		groups[di] = {
			index: di,
			startAngle: x0,
			endAngle: x,
			value: groupSums[di]
		};
		x += dx;
	}

	// Generate chords for each (non-empty) subgroup-subgroup link.
	i = - 1;
	while (++i < n) {
		j = i - 1;
		while (++j < n) {
			var source = subgroups[j * n + i],
				target = subgroups[i * n + j];
			if (source.value || target.value) {
				chords.push(source.value < target.value ? {
					source: target,
					target: source
				} : {
					source: source,
					target: target
				});
			}
		}
	}

	return chords;
}



function expandEdge(dataset, edgedata, allElements, x, y) {
	const investorName = allElements[x < y ? x : y]
	const companyName = allElements[x < y ? y : x]
	const search = dataset.filter(v => v.displayName === companyName && v.name === investorName)
		.map(v => +v.amount.split(" ")[0])
	return edgedata.flatMap(v => {
		if (v.source.index === x && v.source.subindex === y ||
			v.source.index === y && v.source.subindex === x) {
			const original = v
			const result = []
			let currentSrcAngle = original.source.startAngle
			let currentTrgAngle = original.target.startAngle
			const srcAngle = original.source.endAngle - original.source.startAngle
			const trgAngle = original.target.endAngle - original.target.startAngle
			const sum = original.source.value
			search.forEach(v => {
				result.push({
					source: {
						index: original.source.index,
						subindex: original.source.subindex,
						startAngle: currentSrcAngle,
						endAngle: currentSrcAngle + v / sum * srcAngle,
						value: v
					},
					target: {
						index: original.target.index,
						subindex: original.target.subindex,
						startAngle: currentTrgAngle,
						endAngle: currentSrcAngle + v / sum * trgAngle,
						value: v
					}
				})
				currentSrcAngle += v / sum * srcAngle
				currentTrgAngle += v / sum * trgAngle

			})
			console.log(result)
			return result
		} else return v
	})


}

function investmentToMatrix(dataset, selectedInvestors) {
	const dictionary = {}
	const groupToCompany = {}
	const companyToGroup = {}
	const investorsOf = {}
	selectedInvestors.forEach((v) => {
		dictionary[v] = {}

		dataset.filter(d => d.name === v).forEach(element => {
			if (!(element.displayName in dictionary[v])) dictionary[v][element.displayName] = 0
			if (!(element.group in groupToCompany)) groupToCompany[element.group] = new Set()
			if (!(element.displayName in investorsOf)) investorsOf[element.displayName] = new Set()
			investorsOf[element.displayName].add(v)
			groupToCompany[element.group].add(element.displayName)
			companyToGroup[element.displayName] = element.group
			dictionary[v][element.displayName] += +element.amount.split(" ")[0]
		});
	})
	const firms1 = Object.values(groupToCompany).flatMap(v => Array.from(v))
	const length = selectedInvestors.length + firms1.length
	const allElements = selectedInvestors.concat(firms1)
	const chordMatrix = Array(length)
	const arcMatrix = Array(length)
	for (let i = 0; i < length; i++) {
		chordMatrix[i] = Array(length).fill(0)
		arcMatrix[i] = Array(length).fill(0)
	}

	for (let i = 0; i < selectedInvestors.length; i++) {
		for (let j = selectedInvestors.length; j < length; j++) {
			chordMatrix[i][j] = dictionary[allElements[i]][allElements[j]] ? dictionary[allElements[i]][allElements[j]] : 0
			chordMatrix[j][i] = dictionary[allElements[i]][allElements[j]] ? dictionary[allElements[i]][allElements[j]] : 0
			arcMatrix[j][i] = dictionary[allElements[i]][allElements[j]] ? dictionary[allElements[i]][allElements[j]] : 0
		}
	}

	return {
		chordMatrix,
		dictionary,
		allElements,
		groupToCompany,
		companyToGroup,
		investorsOf,
		arcMatrix
	}
}

function topValues(n, data) {
	const sorted = _(Object.keys(data)).sortBy(v => -data[v]).value()
	return sorted.slice(0, n)
}

function pointToArcRibbon(point, d) {
	const cos = Math.cos;
	const sin = Math.sin;
	const pi = Math.PI;
	const halfPi = pi / 2;
	const tau = pi * 2;
	const max = Math.max;
	const dest = d.source
	const startAngle = dest.startAngle - halfPi
	const endAngle = dest.endAngle - halfPi

	const radius = 200
	const sx0 = radius * cos(startAngle),
		sy0 = radius * sin(startAngle)

	const ex0 = radius * cos(endAngle),
		ey0 = radius * sin(endAngle)
	const vector = {
		x: ex0 - sx0,
		y: ey0 - sy0
	}

	let buffer = d3.path()
	buffer.moveTo(point.x, point.y)
	const averageSrc = {
		x: (point.x + sx0) / 2,
		y: (point.y + sy0) / 2
	}
	const averageTrg = {
		x: (point.x + ex0) / 2,
		y: (point.y + ey0) / 2
	}


	buffer.quadraticCurveTo(averageSrc.x + vector.x / 4, averageSrc.y + vector.y / 4, sx0, sy0)

	buffer.arc(0, 0, radius, startAngle, endAngle)
	buffer.quadraticCurveTo(averageSrc.x + vector.x / 4, averageSrc.y + vector.y / 4, point.x, point.y)
	return buffer

}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

d3.csv('consumer_g_investments.csv').then(function (dataset) {

	filtered = dataset.filter(v => v.amount.includes("USD"))
	const alls = _(filtered).map(v => v.name).countBy().value()

	const selectedInvestors = new Set(topValues(20, alls))

	//new Set(filtered.filter(v => top_received.has(v.displayName)).map(v => v.name))

	// new Set([
	// 	"Highland Capital Partners",
	// 	"Wayne Chang",
	// 	"Jason Robins",
	// 	"Niraj Shah",
	// 	"Bob White",
	// 	"Accel Partners"
	// ])

	const {
		chordMatrix,
		dictionary,
		allElements,
		groupToCompany,
		companyToGroup,
		investorsOf,
		arcMatrix
	} = investmentToMatrix(filtered, Array.from(selectedInvestors)) // ["Index Ventures"]

	const groupWithTwoOrMore = Object.keys(groupToCompany).filter(v => groupToCompany[v].size >= 2)
	const domaincolor = color.domain(groupWithTwoOrMore)

	// give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
	var res = chord // padding between entities (black arc)
	(arcMatrix, .01, selectedInvestors.size)
	console.log(res)


	chordG = svg.append("g")
		.attr("transform", `translate(${width / 2},${height / 2})`)


	const group = chordG
		.append("g")
		.attr("class", "chord-group")
		.selectAll(".chord-group")
		.data(res.groups.filter(v => v))
		.join("g")

	group
		.append("path")
		.style("fill", (d) => {
			const element = allElements[d.index];
			if (selectedInvestors.has(element)) return "blue"
			if (groupWithTwoOrMore.includes(companyToGroup[element]))
				return domaincolor(companyToGroup[element])
			return "grey"
		})
		.style("stroke", "black")
		.attr("d", d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius)
		)


	// Draw investor nodes

	const copied = Array.from(selectedInvestors).map(v => {
		return {
			name: v
		}
	})

	const simulation = d3.forceSimulation(copied)
		.force('x', d3.forceX(function (d) {
			const smalls = Object.keys(dictionary[d.name])
			let count = smalls.length
			let dx = 0
			smalls.forEach(v => {
				const index = allElements.indexOf(v)
				const element = res.groups[index]

				const centroid = d3.arc()
					.innerRadius(innerRadius)
					.outerRadius(outerRadius).centroid(element)
				dx += centroid[0]
			})
			return dx / (count + 1)
		})).force('y', d3.forceY(function (d) {
			const smalls = Object.keys(dictionary[d.name])
			let count = smalls.length
			let dy = 0
			smalls.forEach(v => {
				const index = allElements.indexOf(v)
				const element = res.groups[index]
				const centroid = d3.arc()
					.innerRadius(innerRadius)
					.outerRadius(outerRadius).centroid(element)
				dy += centroid[1]
			})
			return (dy + getRandomArbitrary(0, 20)) / (count + 1)
		})).force("collide", d3.forceCollide(8)).stop();

	for (var i = 0; i < 30; ++i) simulation.tick();

	const nodeGroup = chordG.append("g")
		.attr("class", "node-group")
		.selectAll(".node-group")
		.data(copied)
		.join("g")


	nodeGroup.append("circle")
		.attr("cx", d => {
			return d.x

		}).attr("cy", d => {
			return d.y
		}).attr("r", 6).attr("fill", "black")

	console.log(expandEdge(filtered, res, allElements, 5, 12))
	console.log(res)

	// Add the links between groups
	chordG
		.append("g")
		.attr("fill-opacity", 0.67)
		.selectAll("path")
		.data(expandEdge(filtered, res, allElements, 5, 12))
		.join("g")
		.attr("class", "inv-links")
		.append("path")
		.attr("d", d => {
			// (console.log(d), d3.ribbon()
			// .radius(200)(d))
			if (selectedInvestors.has( allElements[d.target.index])) {
				const element = copied[d.target.index]
				return pointToArcRibbon({
					x: element.x,
					y: element.y
				}, d)
			}
			return ""
		})
		.style("fill", (d) => {
			const element = allElements[d.source.index]
			if (groupWithTwoOrMore.includes(companyToGroup[element]))
				return domaincolor(companyToGroup[element])
			return "#69b3a2"
		})
		.style("stroke", "black");

	// Draw text
	group.append("text")
		.each(d => {
			d.angle = (d.startAngle + d.endAngle) / 2;
		})
		.attr("dy", ".35em")
		.attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${innerRadius + 26})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
	  `)
		.attr("opacity", (d) => (d.endAngle - d.startAngle) < 0.05 ? 0 : 1)
		.attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
		.text(d => allElements[d.index]);

})