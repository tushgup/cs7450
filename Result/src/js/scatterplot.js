class CompanyData {
    constructor(dataset) {
        this.incomestatements = Array.from(d3.group(dataset[0], d => d.displayName), ([key, value]) => ({
            key,
            value
        })).map(v => {
            v.value = d3.group(v.value, d => d.year)
            return v
        })
        this.list_companies = this.incomestatements.map(v => v.key)
        this.location = dataset[1]
        this.misc = dataset[2]
        this.tagslist = dataset[3]
        this.alltags = color_tags_mapping
    }

    getAllLocation() {
        return Object.keys(_(this.location)
            .filter(v => v.hq)
            .map(v => v.country)
            .countBy()
            .pickBy(v => v > 150).value()).concat(["Other"])
    }

    getHqOf(company) {
        return this.location.filter(v => v.hq === "True").find(v => v.displayName === company)
    }

    getMarketCapOf(company) {
        const d = this.misc.find(v => v.displayName === company)
        if (d) return +d.stocksSummary < 1e-15 ? undefined : +d.stocksSummary
        else return undefined
    }

    getValuationOf(company) {
        const d = this.misc.find(v => v.displayName === company)
        if (d) return +d.valuation.replace(/ .*/, '') < 1e-15 ? undefined : +d.valuation.replace(/ .*/, '')
        else return undefined
    }

    getExtentOfValuation() {
        return d3.extent(this.list_companies.map(n => {
            const d = this.misc.find(v => v.displayName === n)
            if (d) return +d.valuation.replace(/ .*/, '') < 1e-15 ? undefined : +d.valuation.replace(/ .*/, '')
            else return undefined
        }))
    }

    getExtentOfRevenue(year) {
        const r = d3.extent(_(this.incomestatements)
            .flatMap(v => v.value.get(year.toString()))
            .map(v => v ? +v.revenueUSD : undefined).values())
        r[0] += 1e-15
        return r
    }

    getExtentOfProfit(year) {
        const r = d3.extent(_(this.incomestatements)
            .flatMap(v => v.value.get(year.toString()))
            .map(v => v ? +v.grossProfitUSD : undefined).values())
        return r
    }

    getExtentOfProfitMargin(year) {
        const r = d3.extent(_(this.incomestatements)
            .flatMap(v => v.value.get(year.toString()))
            .map(v => v ? +v.grossProfitMargin : undefined).values())
        return r
    }

    getExtentOfTax(year) {
        const r = d3.extent(_(this.incomestatements)
            .flatMap(v => v.value.get(year.toString()))
            .map(v => v ? +v.incomeTaxExpense : undefined).values())
        return r
    }


    

    getTags(company) {
        return eval(this.tagslist.find(v => v.displayName === company).major_tags)

    }

    getRandTags(company) {
        const d = this.tagslist.find(v => v.displayName === company)
        if (!d) return "gray"
        let rand = Math.round(Math.random())
        return this.alltags[eval(d.major_tags).length > 1 ? eval(d.major_tags)[rand] : eval(d.major_tags)[0]]
    }
}

class ScatterplotState {
    static state;
    constructor(dataset) {
        // dataset

        this.data = new CompanyData(dataset)
        // Filter
        this.year = 2014

        // draw here

        this.svg = d3.select("svg.scatterplot_svg")
        this.svgheight = 700
        this.svgwidth = 1000
        this.margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        }
        this.width = this.svgwidth - this.margin.left * 2 - this.margin.right
        this.height = this.svgheight - 50 - this.margin.top - this.margin.bottom
        this.padding = 1 // separation between nodes
        this.radius = 6
        this.xScale = d3.scalePoint()
            .range([this.margin.left * 2, this.width]);
        this.yScale = d3.scaleSqrt()
            .range([this.height, 0]);

        this.y = this.yScale.domain(this.data.getExtentOfRevenue(this.year)).nice()
        this.x = this.xScale.domain(this.data.getAllLocation())
        this.allLocationsCat = this.data.getAllLocation()
        this.chartScale = {
            x: "location",
            y: "revenue"
        }

        this.axisL = this.svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', `translate(${this.margin.left * 1.8},${this.margin.top})`)
            .call(d3.axisLeft(this.y).tickFormat(DetailsState.formatAxis))

        this.axisL.append("text").text("Revenue")

        this.axisB = this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(${this.margin.left * 2},${700 - this.margin.bottom})`)
            .call(d3.axisBottom(this.x))

        this.tagsSet = new Set(Object.keys(color_tags_mapping))
        this.tagsSetAll = new Set(this.tagsSet)
    }

    static addTag(tag) {
        ScatterplotState.state.tagsSet.add(tag)
        ScatterPlotChart.updateCharts()
    }

    static resetTag() {
        ScatterplotState.state.tagsSet = new Set(ScatterplotState.state.tagsSetAll)
        ScatterPlotChart.updateCharts()
    }

    static clearTag() {
        ScatterplotState.state.tagsSet = new Set()
        ScatterPlotChart.updateCharts()
    }

    static removeTag(tag) {
        ScatterplotState.state.tagsSet.delete(tag)
        ScatterPlotChart.updateCharts()

    }

    static selectNode(company) {
        ScatterplotState.state.nodeG
            .selectAll(".scattter_comp")
            .each(function (d) {
                if (d.key !== company) return
                DetailsState.reset()
                DetailsState.select(d.key)
                ScatterplotState.state.resetElement()
                ScatterplotState.state.selectedElement = this
                ScatterplotState.state.greyOutAllElement()
                d3.select(this).select(".scatternode").attr("opacity", 1)

                 //Make treemap
                treemap.generateChart(d.key, ScatterplotState.state.year)

                //Make barchart for ethnicity viz
                ethnicity_barchart.generateChart(d.key, ScatterplotState.state.year)

                //Make piechart for gender viz
                gender_piechart.generateChart(d.key, ScatterplotState.state.year)
            })
    }

    axisLGenerator(option) {
        switch (option) {
            case "location":
                this.yScale = d3.scalePoint().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getAllLocation())
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y))
                break;
            case "revenue":
                this.yScale = d3.scaleSqrt().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfRevenue(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(DetailsState.formatAxis))
                break;
            case "valuation":
                this.yScale = d3.scaleSqrt().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfValuation()).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(DetailsState.formatAxis))
                break;
            case "profit":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfProfit(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(DetailsState.formatAxis))
                break;
            case "profitmargin":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfProfitMargin(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2")))
                break;
            case "tax":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfTax(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(DetailsState.formatAxis))
                break;
            default:
                console.log("Something is wrong. Fucked!")
        }
    }

    axisBGenerator(option) {
        switch (option) {
            case "location":
                this.xScale = d3.scalePoint().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getAllLocation())
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x))
                break;
            case "revenue":
                this.xScale = d3.scaleSqrt().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfRevenue(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(DetailsState.formatAxis))
                break;
            case "valuation":
                this.xScale = d3.scaleSqrt().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfValuation()).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(DetailsState.formatAxis))
                break;
            case "profit":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfProfit(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(DetailsState.formatAxis))
                break;
            case "profitmargin":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfProfitMargin(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2")))
                break;
            case "tax":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfTax(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(DetailsState.formatAxis))
                break;
            default:
                console.log("Something is wrong. Fucked!")
        }
    }

    getValueOfField(option, d) {
        switch (option) {
            case "location":
                const located = this.data.getHqOf(d.key)
                const locCat = located &&
                    (this.allLocationsCat.includes(located.country)) ?
                    located.country : "Other"
                return locCat
            case "revenue": {
                const search = d.value.get(this.year.toString())
                if (!search) return undefined
                return +search[0].revenueUSD
            }
            case "valuation":
                return this.data.getValuationOf(d.key)
            case "profit": {
                const search = d.value.get(this.year.toString())
                if (!search) return undefined
                return +search[0].grossProfitUSD
            }
            case "profitmargin": {
                const search = d.value.get(this.year.toString())
                if (!search) return undefined
                return +search[0].grossProfitMargin
            }
            case "tax": {
                const search = d.value.get(this.year.toString())
                if (!search) return undefined
                return +search[0].incomeTaxExpense
            }
            default:
                console.log("Something is wrong. Fucked!")
        }
    }

    resetElement() {
        d3.selectAll(".scatternode").attr("opacity", "1")
    }

    greyOutAllElement() {
        d3.selectAll(".scatternode").attr("opacity", "0.4")

    }

}

// ------------------- Slider --------------------------
var sliderStep = d3
    .sliderBottom()
    .min(2014)
    .max(2018)
    .width(500)
    .tickFormat(d3.format('d'))
    .ticks(5)
    .step(1)
    .default(0.015)
    .on('onchange', val => {
        ScatterplotState.state.year = val
        ScatterplotState.state.axisLGenerator(ScatterplotState.state.chartScale.y)
        ScatterplotState.state.axisBGenerator(ScatterplotState.state.chartScale.x)
        ScatterPlotChart.updateCharts()

        //Remake treemap to make based on new year value
        treemap.generateChart(document.getElementById("companyName").textContent, ScatterplotState.state.year)

        //Remake ethinicity barchart to make based on new year value
        ethnicity_barchart.generateChart(document.getElementById("companyName").textContent, ScatterplotState.state.year)

        //Remake gender piechart to make based on new year value
        gender_piechart.generateChart(document.getElementById("companyName").textContent, ScatterplotState.state.year)
    });

var gStep = d3
    .select('div#slider-time svg')
    .append('g')

gStep.call(sliderStep);

gStep.select("#slider-time svg g.parameter-value path")
    .attr("transform", "rotate(360)")
    .attr('d', "M10,0A10,10,0,1,1,9.999500004166652,-0.09999833334166695Z")

// ======================= Draw scatterplot data ========================================
Promise.all([d3.csv("./data/incomestatements.csv"), d3.csv("./data/locations.csv"), d3.csv("./data/misc.csv"), d3.csv("./data/tags_list.csv")])
    .then(function (data) {
        DetailsState.state.data.receiveFromScatter(data)


        ScatterplotState.state = new ScatterplotState(data)
        $('#searchbox').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'states',
            source: substringMatcher(ScatterplotState.state.data.list_companies)
        });


        ScatterplotState.state.nodeG = ScatterplotState.state.svg.append("g")
            .attr('transform', `translate(${ScatterplotState.state.margin.left * 2},${ScatterplotState.state.margin.top})`)

        ScatterPlotChart.updateCharts()

    })
class ScatterPlotChart {
    static onxaxischange() {
        var select = d3.select('#xaxis').node();
        // Get current value of select element
        var category = select.options[select.selectedIndex].value;
        // Update chart with the selected category of letters
        ScatterplotState.state.chartScale.x = category;
        ScatterplotState.state.axisLGenerator(ScatterplotState.state.chartScale.y)
        ScatterplotState.state.axisBGenerator(ScatterplotState.state.chartScale.x)
        ScatterPlotChart.updateCharts()
    }

    static onyaxischange() {
        var select = d3.select('#yaxis').node();
        // Get current value of select element
        var category = select.options[select.selectedIndex].value;
        // Update chart with the selected category of letters
        ScatterplotState.state.chartScale.y = category;
        ScatterplotState.state.axisLGenerator(ScatterplotState.state.chartScale.y)
        ScatterplotState.state.axisBGenerator(ScatterplotState.state.chartScale.x)
        ScatterPlotChart.updateCharts()
    }

    static updateCharts() {
        var simulation = d3.forceSimulation(ScatterplotState.state.data.incomestatements)
            .force("x", d3.forceX(function (d) {
                const tags = ScatterplotState.state.data.getTags(d.key)
                const show = tags.every(v => ScatterplotState.state.tagsSet.has(v))
                if (!show) return (ScatterplotState.state.svgwidth + 100)
                const xVal = ScatterplotState.state.getValueOfField(ScatterplotState.state.chartScale.x, d)
                const dx = xVal ? ScatterplotState.state.x(xVal) : (ScatterplotState.state.svgwidth + 100)
                return dx
            }).strength(1))
            .force("y", d3.forceY(function (d) {
                const tags = ScatterplotState.state.data.getTags(d.key)
                const show = tags.every(v => ScatterplotState.state.tagsSet.has(v))
                if (!show) return (ScatterplotState.state.svgheight + 100)
                const yVal = ScatterplotState.state.getValueOfField(ScatterplotState.state.chartScale.y, d)
                const dy = yVal ? ScatterplotState.state.y(yVal) : (ScatterplotState.state.svgheight + 100)

                return dy
            }).strength(1))
            .force("collide", d3.forceCollide(10))
            .stop()


        const t = ScatterplotState.state.svg.transition()
            .duration(3000);

        for (var i = 0; i < 30; ++i) simulation.tick();

        ScatterplotState.state.nodeG.selectAll(".scattter_comp")
            .data(ScatterplotState.state.data.incomestatements)
            .join(enter => {
                    const g = enter.append("g")
                        .attr("class", "scattter_comp")
                        .attr("transform", d => {
                            const yVal = ScatterplotState.state.getValueOfField(ScatterplotState.state.chartScale.y, d)
                            const dy = yVal ? ScatterplotState.state.y(yVal) : (ScatterplotState.state.svgheight + 100)
                            const xVal = ScatterplotState.state.getValueOfField(ScatterplotState.state.chartScale.x, d)
                            const dx = xVal ? ScatterplotState.state.x(xVal) : (ScatterplotState.state.svgwidth + 100)
                            return `translate(${dx}, ${dy})`
                        })

                    g.append("text")
                    .attr("fill", "white")
                    .attr("y", -10)
                    .attr("text-anchor", "middle")
                    .attr("opacity", 0)
                    .text((d) => {
                        return d.key
                    })
                    g.each(function (d) {
                        return ScatterPlotUtility.shapeToFormat(d3.select(this), ScatterplotState.state.data.getRandTags(d.key))
                    })
                    
                    g.selectAll(".scatternode").on("mouseover", function () {
                        const j = d3.select(this.parentNode).attr("transform")
                        d3.select(this.parentNode).attr("transform", `${j} scale(1.3, 1.3)`)
                        d3.select(this.parentNode).select("text").attr("opacity", 1)
                    }).on("mouseout", function () {
                        const j = d3.select(this.parentNode).attr("transform").indexOf("scale")
                        d3.select(this.parentNode).attr("transform", d3.select(this.parentNode).attr("transform").substr(0, j - 1))
                        d3.select(this.parentNode).select("text").attr("opacity", 0)

                    }).on("click", function (d, i) {
                        DetailsState.reset()
                        DetailsState.select(d.key)
                        ScatterplotState.state.resetElement()
                        ScatterplotState.state.selectedElement = this.parentNode
                        ScatterplotState.state.greyOutAllElement()
                        d3.select(this.parentNode).select(".scatternode").attr("opacity", 1)

                        //Make treemap
                        treemap.generateChart(d.key, ScatterplotState.state.year)

                        //Make barchart for ethnicity viz
                        ethnicity_barchart.generateChart(d.key, ScatterplotState.state.year)

                        //Make piechart for gender viz
                        gender_piechart.generateChart(d.key, ScatterplotState.state.year)
                    })



                    return g.call(enter => enter.transition(t)
                        .attr("transform", d => `translate(${d.x}, ${d.y})`))
                },
                update => update.call(update => update.transition(t)
                    .attr("transform", d => `translate(${d.x}, ${d.y})`)),

            )
    }
}

// ==================== Legend ====================================
d3.selectAll(".scatterplot_legend_shape").each(function (d) {
    const attribute = this.getAttribute("data-checkbox")
    const f = color_tags_mapping[attribute]
    ScatterPlotUtility.mapToFormat(d3.select(this), f)
})

d3.selectAll(".scatterplot_checkbox_svg").append("rect")
    .attr("width", 100)
    .attr("height", 100)
    .attr("fill", "white")
    .attr("stroke-width", 25)
    .attr("stroke", "white")
    .on("click", function (d) {
        const attribute = this.parentElement.dataset.checkbox

        const selected = d3.select(this).attr("fill") === "white"

        d3.select(this).attr("fill", selected ? "black" : "white")
        if (attribute === "All") {
            d3.selectAll(".scatterplot_checkbox_svg")
                .selectAll("rect")
                .attr("fill", selected ? "black" : "white")
            if (selected)
                ScatterplotState.clearTag()
            else
                ScatterplotState.resetTag()
            return
        }


        if (selected)
            ScatterplotState.removeTag(attribute)
        else
            ScatterplotState.addTag(attribute)

    })


