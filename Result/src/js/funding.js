class FundingState {
    constructor(dataset) {
        this.data = new FundingData(dataset)
        this.svg = d3.select('svg.funding_svg');
        this.width = 700;
        this.height = 700;
        this.innerRadius = 200
        this.outerRadius = this.innerRadius + 10
        this.color = d3.scaleOrdinal(d3.schemeCategory10)
    }
}

class FundingData {
    constructor(dataset) {
        this.dataset = dataset.filter(v => v.amount.includes("USD"))
        this.allInvestors = _(this.dataset).map(v => v.name).countBy().value()
    }

    investmentToMatrix(selectedInvestors) {
        const dictionary = {}
        const groupToCompany = {}
        const companyToGroup = {}
        const investorsOf = {}
        selectedInvestors.forEach((v) => {
            dictionary[v] = {}

            this.dataset.filter(d => d.name === v).forEach(element => {
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

    getTopInvestors(n) {
        return topValues(n, this.allInvestors)
    }

    expandEdge(edgedata, allElements, x, y) {
        const investorName = allElements[x < y ? x : y]
        const companyName = allElements[x < y ? y : x]
        const search = this.dataset.filter(v => v.displayName === companyName && v.name === investorName)
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
                return result
            } else return v
        })


    }
}

let fundingstate;


function topValues(n, data) {
    const sorted = _(Object.keys(data)).sortBy(v => -data[v]).value()
    return sorted.slice(0, n)
}



function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

d3.csv('./data/consumer_g_investments.csv').then(function (dataset) {

    fundingstate = new FundingState(dataset)
    fundingstate.chordG = fundingstate.svg.append("g")
        .attr("transform", `translate(${fundingstate.width / 2},${fundingstate.height / 2})`)

    ArcChart.updateCharts()

})

class ArcChart {

    static pointToArcRibbon(point, d, radius) {
        const cos = Math.cos;
        const sin = Math.sin;
        const pi = Math.PI;
        const halfPi = pi / 2;
        const tau = pi * 2;
        const max = Math.max;
        const dest = d.source
        const startAngle = dest.startAngle - halfPi
        const endAngle = dest.endAngle - halfPi

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

    static chord(matrix, padAngle, m) {
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
        x = 0, i = -1;
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
        i = -1;
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

    static updateCharts() {
        const selectedInvestors = fundingstate.data.getTopInvestors(20)

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
        } = fundingstate.data.investmentToMatrix(Array.from(selectedInvestors)) // ["Index Ventures"]

        const groupWithTwoOrMore = Object.keys(groupToCompany).filter(v => groupToCompany[v].size >= 2)
        const domaincolor = fundingstate.color.domain(groupWithTwoOrMore)

        // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
        var res = ArcChart.chord // padding between entities (black arc)
        (arcMatrix, 0.01, selectedInvestors.length)



        const group = fundingstate.chordG
            .append("g")
            .attr("class", "chord-group")
            .selectAll(".chord-group")
            .data(res.groups.filter(v => v))
            .join("g")

        group
            .append("path")
            .style("fill", (d) => {
                const element = allElements[d.index];
                if (selectedInvestors.includes(element)) return "blue"
                if (groupWithTwoOrMore.includes(companyToGroup[element]))
                    return domaincolor(companyToGroup[element])
                return "grey"
            })
            .attr("d", d3.arc()
                .innerRadius(fundingstate.innerRadius)
                .outerRadius(fundingstate.outerRadius)
            )


        // Draw investor nodes

        const copied = selectedInvestors.map(v => {
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
                        .innerRadius(fundingstate.innerRadius)
                        .outerRadius(fundingstate.outerRadius).centroid(element)
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
                        .innerRadius(fundingstate.innerRadius)
                        .outerRadius(fundingstate.outerRadius).centroid(element)
                    dy += centroid[1]
                })
                return (dy + getRandomArbitrary(0, 20)) / (count + 1)
            })).force("collide", d3.forceCollide(8)).stop();

        for (var i = 0; i < 30; ++i) simulation.tick();

        const nodeGroup = fundingstate.chordG.append("g")
            .attr("class", "node-group")
            .selectAll(".node-group")
            .data(copied)
            .join("g")


        nodeGroup.append("circle")
            .attr("cx", d => {
                return d.x

            }).attr("cy", d => {
                return d.y
            }).attr("r", 6).attr("fill", "white")

        console.log(res)

        // Add the links between groups
        fundingstate.chordG
            .append("g")
            .attr("fill-opacity", 0.67)
            .selectAll("path")
            .data(res)
            .join("g")
            .attr("class", "inv-links")
            .append("path")
            .attr("d", d => {
                // (console.log(d), d3.ribbon()
                // .radius(200)(d))
                if (selectedInvestors.includes(allElements[d.target.index])) {
                    const element = copied[d.target.index]
                    return ArcChart.pointToArcRibbon({
                        x: element.x,
                        y: element.y
                    }, d, fundingstate.innerRadius)
                }
                return ""
            })
            .style("fill", (d) => {
                const element = allElements[d.source.index]
                if (groupWithTwoOrMore.includes(companyToGroup[element]))
                    return domaincolor(companyToGroup[element])
                return "#69b3a2"
            })
            .style("stroke", "white");

        // Draw text
        group.append("text")
            .each(d => {
                d.angle = (d.startAngle + d.endAngle) / 2;
            })
            .attr("dy", ".35em")
            .attr("fill", "white")
            .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${fundingstate.innerRadius + 26})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
	  `)
            .attr("opacity", (d) => (d.endAngle - d.startAngle) < 0.05 ? 0 : 1)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => allElements[d.index]);
    }
}