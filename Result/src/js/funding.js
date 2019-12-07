class FundingState {
    constructor(dataset) {
        this.data = new FundingData(dataset)
        this.svg = d3.select('svg.funding_svg');
        this.width = 700;
        this.height = 700;
        this.innerRadius = 200
        this.outerRadius = this.innerRadius + 10
        this.color10 = d3.scaleOrdinal(d3.schemeCategory10)
        this.colorStage = d3.scaleSequential(d3.interpolateReds)
        this.selected = new Set()
    }

    static state;

}

class FundingData {
    constructor(dataset) {
        this.dataset = dataset.filter(v => v.amount.includes("USD"))
        this.allInvestors = _(this.dataset).map(v => v.name).countBy().value()
        this.sum = {}
        this.dataset.forEach((v) => {
            if (!(v.name in this.sum)) this.sum[v.name] = 0
            if (+v.amount.split(" ")[0])
            this.sum[v.name] += (+v.amount.split(" ")[0])

        })
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

    expandEdge(edgedata, allElements, x) {
        if (x.size == 0) return edgedata
        return edgedata.flatMap(v => {
            if (x.has(allElements[v.target.index])) {
                const original = v
                const result = []
                let currentSrcAngle = original.source.startAngle
                let currentTrgAngle = original.target.startAngle
                const srcAngle = original.source.endAngle - original.source.startAngle
                const trgAngle = original.target.endAngle - original.target.startAngle
                const sum = original.source.value
                const search = this.dataset.filter(d => d.name === allElements[v.target.index] && d.displayName === allElements[v.target.subindex])
                search.forEach(v => {
                    const value = +v.amount.split(" ")[0]
                    result.push({
                        source: {
                            index: original.source.index,
                            subindex: original.source.subindex,
                            startAngle: currentSrcAngle,
                            endAngle: currentSrcAngle + value / sum * srcAngle,
                            value: value,
                        },
                        target: {
                            index: original.target.index,
                            subindex: original.target.subindex,
                            startAngle: currentTrgAngle,
                            endAngle: currentSrcAngle + value / sum * trgAngle,
                            value: value
                        },
                        stage: v.stage,
                        date: v.date,
                        value: value
                    })
                    console.log(v.stage)
                    currentSrcAngle += value / sum * srcAngle
                    currentTrgAngle += value / sum * trgAngle

                })
                return result
            } else return v
        })


    }
}



function topValues(n, data) {
    const sorted = _(Object.keys(data)).sortBy(v => -data[v]).value()
    return sorted.slice(0, n)
}



function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function createGroup() {
    FundingState.state.chordG = FundingState.state.svg.append("g")
        .attr("transform", `translate(${FundingState.state.width / 2},${FundingState.state.height / 2})`)
    FundingState.state.linkG = FundingState.state.chordG
        .append("g")
        .attr("fill-opacity", 0.8)

    FundingState.state.outerchordsG = FundingState.state.chordG
        .append("g")
        .attr("class", "chord-group")

    FundingState.state.nodeG = FundingState.state.chordG.append("g")
        .attr("class", "node-group")
}

let selectedInvestors = [
    "Accel Partners"
]
let allinvestors;
function addInvestors(investors) {
    if (!allinvestors.has(investors)) return false
    const s = new Set(selectedInvestors)
    if (s.has(investors)) return false
    s.add(investors)
    selectedInvestors = Array.from(s)
    FundingState.state.svg.selectAll("*").remove();
    createGroup()
    ArcChart.updateCharts()
    return true

}

function deleteInvestors(investors) {
    const s = new Set(selectedInvestors)
    s.delete(investors)
    FundingState.state.selected.delete(investors)
    selectedInvestors = Array.from(s)
    FundingState.state.svg.selectAll("*").remove();
    createGroup()
    ArcChart.updateCharts()

}


d3.csv('./data/investments.csv').then(function (dataset) {

    FundingState.state = new FundingState(dataset)
    // var transform = d3.zoomIdentity.translate(FundingState.state.width / 2, FundingState.state.height / 2).scale(1);

    // FundingState.state.svg.call(d3.zoom()
    //     .extent([
    //         [0, 0],
    //         [FundingState.state.width, FundingState.state.height]
    //     ])
    //     .scaleExtent([1, 8])
    //     .on("zoom", zoomed)).call(d3.zoom().transform, transform);

    // function zoomed() {
    //     FundingState.state.svg.select("g").attr("transform", d3.event.transform);
    // }

    const j = Object.keys(FundingState.state.data.allInvestors)
    allinvestors = new Set(j)
    let scl = d3.scaleLinear()
    .domain(d3.extent(Object.entries(FundingState.state.data.sum).map(v => v[1])))
    .range([0, 17])

    var few = d3
    .select("#chart_div").selectAll("svg")
    .data(Object.entries(FundingState.state.data.sum).sort((a, b) => -a[1] + b[1]).map(v => {
        return {name: v[0], value: v[1]}
    })).enter()
    .append("svg")
    .attr("data-in", d => d.name)
    .attr("data-selected", d => {
        if (d.name === "Accel Partners") return 1
        return 0
    })
    .attr("width", "90%")
    .attr("height", "10%")
    .attr("viewBox", "0 0 18 2")
    .attr("class", d => {
        if (d.name === "Accel Partners") return "svg_selected"
        return ""
    })


    // few.append("rect")
    // .attr("fill", "white")
    // .attr("style", "mix-blend-mode: difference;")
    // .attr("x", d=>scl(d.value))
    // .attr("y", 0)
    // .attr("width", "0.2")
    // .attr("height", "2")

    few.append("text")
        .text(d => d.name)
        .attr("class", "disable-select")
        .attr("style", "mix-blend-mode: difference;")
        .attr("fill", "orange")
        .attr("font-size", "5%")
        .attr("x", 0.3)
        .attr("y", 0.7)
    few.append("text")
        .text(d => DetailsState.format(d.value))
        .attr("class", "disable-select")
        .attr("style", "mix-blend-mode: difference;")
        .attr("fill", "orange")
        .attr("font-size", "5%")
        .attr("x", 0.3)
        .attr("y", 1.7)
    
    



    $('#searchbox-investment').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name: 'states',
        source: substringMatcher(j)
    });

    createGroup()


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
        // const selectedInvestors = FundingState.state.data.getTopInvestors(20)

        const tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
            return `
            <p>Stage: ${d.stage}</p>
            <p> Date: ${d.date}</p>
            <p> Value: ${d.value}</p>
            `;
        }).offset(function () {
            return [this.getBBox().height / 2, 0]
        });


        FundingState.state.svg.call(tip)

        //new Set(filtered.filter(v => top_received.has(v.displayName)).map(v => v.name))
        // const selectedInvestors = [
        //     "Highland Capital Partners",
        //     "Wayne Chang",
        //     "Jason Robins",
        //     "Niraj Shah",
        //     "Bob White",
        //     "Accel Partners"
        // ]

        const {
            chordMatrix,
            dictionary,
            allElements,
            groupToCompany,
            companyToGroup,
            investorsOf,
            arcMatrix
        } = FundingState.state.data.investmentToMatrix(Array.from(selectedInvestors)) // ["Index Ventures"]

        const groupWithTwoOrMore = Object.keys(groupToCompany).filter(v => groupToCompany[v].size >= 2)
        const domaincolor = FundingState.state.color10.domain(groupWithTwoOrMore)

        // Calculate layout
        let res = FundingState.state.res = ArcChart.chord // padding between entities (black arc)
        (arcMatrix, 0.01, selectedInvestors.length)

        // Draw outer chords

        FundingState.state.outerchordsG
            .selectAll("g")
            .data(res.groups.filter(v => v), d => d.index)
            .join(enter => {
                const group = enter.append("g")
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
                        .innerRadius(FundingState.state.innerRadius)
                        .outerRadius(FundingState.state.outerRadius)
                    )

                // Draw text
                group.append("text")
                    .each(d => {
                        d.angle = (d.startAngle + d.endAngle) / 2;
                    })
                    .attr("dy", ".35em")
                    .attr("fill", "white")
                    .attr("transform", d =>
                        `
                        rotate(${(d.angle * 180 / Math.PI - 90)})
                        translate(${FundingState.state.innerRadius + 26})
                        ${d.angle > Math.PI ? "rotate(180)" : ""}`)
                    .attr("opacity", (d) => (d.endAngle - d.startAngle) < 0.05 ? 0 : 1)
                    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
                    .text(d => allElements[d.index])
                    .on('click', (d) => { DetailsState.select(allElements[d.index])});
                return group
            }, update => update, exit => exit.remove())


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
                        .innerRadius(FundingState.state.innerRadius)
                        .outerRadius(FundingState.state.outerRadius).centroid(element)
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
                        .innerRadius(FundingState.state.innerRadius)
                        .outerRadius(FundingState.state.outerRadius).centroid(element)
                    dy += centroid[1]
                })
                return (dy + getRandomArbitrary(0, 20)) / (count + 1)
            })).force("collide", d3.forceCollide(8)).stop();

        for (var i = 0; i < 30; ++i) simulation.tick();

        FundingState.state.nodeG
            .selectAll("g")
            .data(copied, (d) => d.name)
            .join(enter => {
                const nodeGroup = enter.append("g")
                    .attr("transform", d => {
                        return `translate(${d.x}, ${d.y})`
                    }).attr("opacity", function (v) {
                        if (FundingState.state.selected.size == 0) return 1
                        if (FundingState.state.selected.has(v.name)) return 1
                        return 0.2
                    })


                nodeGroup.append("circle")
                    .attr("r", 6)
                    .attr("fill", "white")
                    .on("mouseover", function (d) {
                        // if (FundingState.state.selected.size > 0) return
                        FundingState.state.chordG.selectAll(".inv-links")
                            .attr("fill-opacity", (da, i) => {
                                if (FundingState.state.selected.has(allElements[da.target.index])) return 0.8
                                if (d.name === allElements[da.target.index]) {
                                    return 0.8
                                } else return 0

                            })

                        d3.select(".node-group").selectAll("g").attr("opacity", function (v) {
                            if (FundingState.state.selected.has(v.name)) return 1
                            if (v.name == d.name) return 1
                            return 0.2
                        })

                        d3.select(this.parentNode).select("text").attr("visibility", "visible")
                    }).on("mouseout", function (d) {
                        FundingState.state.chordG.selectAll(".inv-links")
                            .attr("fill-opacity", (da, i) => {
                                if (FundingState.state.selected.has(allElements[da.target.index])) return 0.8
                                if (FundingState.state.selected.size > 0) return 0
                                return 0.5

                            })

                        d3.select(".node-group").selectAll("text").attr("visibility", function (v) {
                            if (FundingState.state.selected.has(v.name)) return "visible"
                            return "hidden"
                        })

                        d3.select(".node-group").selectAll("g").attr("opacity", function (v) {
                            if (FundingState.state.selected.size == 0) return 1
                            if (FundingState.state.selected.has(v.name)) return 1
                            return 0.2
                        })

                    }).on("click", function (d) {
                        if (!FundingState.state.selected.has(d.name))
                            FundingState.state.selected.add(d.name)
                        else FundingState.state.selected.delete(d.name)
                        d3.select(".node-group").selectAll("g").attr("opacity", function (v) {
                            if (FundingState.state.selected.has(v.name)) return 1
                            return 0.2
                        })
                        d3.select(".node-group").selectAll("text").attr("visibility", function (v) {
                            if (FundingState.state.selected.has(v.name)) return "visible"
                            return "hidden"
                        })

                        const expanded = FundingState.state.data.expandEdge(res, allElements, FundingState.state.selected)

                        FundingState.state.linkG
                            .selectAll("g")
                            .data(expanded, d => d.source)
                            .join(enter => {
                                const group = enter.append("g")
                                    .attr("class", "inv-links")
                                    .attr("fill-opacity", (v) => {
                                        if (FundingState.state.selected.has(allElements[v.target.index])) return 0.8
                                        if (FundingState.state.selected.size > 0) return 0
                                        return 0.5
                                    })

                                group.append("path")
                                    .attr("d", d => {
                                        if (selectedInvestors.includes(allElements[d.target.index])) {
                                            const element = copied[d.target.index]
                                            return ArcChart.pointToArcRibbon({
                                                x: element.x,
                                                y: element.y
                                            }, d, FundingState.state.innerRadius)
                                        }
                                        return ""
                                    })
                                    .style("fill", (d) => {
                                        const element = allElements[d.source.index]
                                        if (groupWithTwoOrMore.includes(companyToGroup[element]))
                                            return domaincolor(companyToGroup[element])
                                        return "#69b3a2"
                                    }).on("mouseover", function (d) {
                                        if (d.stage || d.date || d.value)
                                            tip.show.bind(this)(d)
                                    })
                                    .on("mouseout", tip.hide)
                                return group
                            }, update => update.on("mouseover", function (d) {
                                if (d.stage || d.date || d.value)
                                    tip.show.bind(this)(d)
                            }));
                    })


                nodeGroup.append("text").attr("fill", "white")
                    .attr("visibility", function (v) {
                        if (FundingState.state.selected.has(v.name)) return "visible"
                        return "hidden"
                    })
                    .attr("x", "10").text(d => d.name)
                return nodeGroup
            }, update => update.attr("transform", d => {
                return `translate(${d.x}, ${d.y})`
            }))

        // Add the links between groups
        const expanded = FundingState.state.data.expandEdge(res, allElements, FundingState.state.selected)

        FundingState.state.linkG
            .selectAll("g")
            .data(expanded, d => d.source)
            .join(enter => {
                const group = enter.append("g")
                    .attr("class", "inv-links")
                    .attr("fill-opacity", (v) => {
                        if (FundingState.state.selected.has(allElements[v.target.index])) return 0.8
                        if (FundingState.state.selected.size > 0) return 0
                        return 0.5
                    })

                group.append("path")
                    .attr("d", d => {
                        if (selectedInvestors.includes(allElements[d.target.index])) {
                            const element = copied[d.target.index]
                            return ArcChart.pointToArcRibbon({
                                x: element.x,
                                y: element.y
                            }, d, FundingState.state.innerRadius)
                        }
                        return ""
                    })
                    .style("fill", (d) => {
                        const element = allElements[d.source.index]
                        if (groupWithTwoOrMore.includes(companyToGroup[element]))
                            return domaincolor(companyToGroup[element])
                        return "#69b3a2"
                    }).on("mouseover", function (d) {
                        if (d.stage || d.date || d.value)
                        tip.show.bind(this)(d)
                    }).on("mouseout", tip.hide)
                return group
            });

    }
}