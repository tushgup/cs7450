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
        return this.location.filter(v => v.hq).find(v => v.displayName === company)
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


    getColor(company) {
        const d = this.tagslist.find(v => v.displayName === company)
        if (!d) return "gray"
        let rand = Math.round(Math.random())
        return this.alltags[eval(d.major_tags).length > 1 ? eval(d.major_tags)[rand] : eval(d.major_tags)[0]].color
    }

    getShape(company) {
        const d = this.tagslist.find(v => v.displayName === company)
        if (!d) return "gray"
        let rand = Math.round(Math.random())
        return this.alltags[eval(d.major_tags).length > 1 ? eval(d.major_tags)[rand] : eval(d.major_tags)[0]].shape
    }
}

class ScatterplotState {
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
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
            .call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))

        this.axisB = this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(${this.margin.left * 2},${700 - this.margin.bottom})`)
            .call(d3.axisBottom(this.x))
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
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))
                break;
            case "valuation":
                this.yScale = d3.scaleSqrt().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfValuation()).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))
                break;
            case "profit":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfProfit(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))
                break;
            case "profitmargin":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfProfitMargin(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))
                break;
            case "tax":
                this.yScale = d3.scaleLinear().range([this.height, 0])
                this.y = this.yScale.domain(this.data.getExtentOfTax(this.year)).nice()
                this.axisL.transition().duration(1500).call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")))
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
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2s")))
                break;
            case "valuation":
                this.xScale = d3.scaleSqrt().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfValuation()).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2s")))
                break;
            case "profit":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfProfit(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2s")))
                break;
            case "profitmargin":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfProfitMargin(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2s")))
                break;
            case "tax":
                this.xScale = d3.scaleLinear().range([this.margin.left * 2, this.width]);
                this.x = this.xScale.domain(this.data.getExtentOfTax(this.year)).nice()
                this.axisB.transition().duration(1500).call(d3.axisBottom(this.x).tickFormat(d3.format(".2s")))
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

}
var scatter_state;



Promise.all([d3.csv("./data/incomestatements.csv"), d3.csv("./data/locations.csv"), d3.csv("./data/misc.csv"), d3.csv("./data/tags_list.csv")])
    .then(function (data) {
        scatter_state = new ScatterplotState(data)

        // ------------------- Slider --------------------------
        // Step
        var sliderStep = d3
            .sliderBottom()
            .min(2014)
            .max(2018)
            .width(300)
            .tickFormat(d3.format('d'))
            .ticks(5)
            .step(1)
            .default(0.015)
            .on('onchange', val => {
                scatter_state.year = val
                scatter_state.axisLGenerator(scatter_state.chartScale.y)
                scatter_state.axisBGenerator(scatter_state.chartScale.x)

                updateCharts()
            });

        var gStep = d3
            .select('div#slider-step')
            .append('svg')
            .attr('width', 500)
            .attr('height', 100)
            .attr("style", `position: absolute;
    left: 0px;`)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gStep.call(sliderStep);
        scatter_state.nodeG = scatter_state.svg.append("g")
            .attr('transform', `translate(${scatter_state.margin.left * 2},${scatter_state.margin.top})`)

        updateCharts()

    })

function onxaxischange() {
    var select = d3.select('#xaxis').node();
    // Get current value of select element
    var category = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    scatter_state.chartScale.x = category;
    scatter_state.axisLGenerator(scatter_state.chartScale.y)
    scatter_state.axisBGenerator(scatter_state.chartScale.x)
    updateCharts()
}

function onyaxischange() {
    var select = d3.select('#yaxis').node();
    // Get current value of select element
    var category = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    scatter_state.chartScale.y = category;
    scatter_state.axisLGenerator(scatter_state.chartScale.y)
    scatter_state.axisBGenerator(scatter_state.chartScale.x)
    updateCharts()
}

function updateCharts() {
    var simulation = d3.forceSimulation(scatter_state.data.incomestatements)
        .force("x", d3.forceX(function (d) {
            const xVal = scatter_state.getValueOfField(scatter_state.chartScale.x, d)
            const dx = xVal ? scatter_state.x(xVal) : (scatter_state.svgwidth + 100)
            return dx
        }).strength(1))
        .force("y", d3.forceY(function (d) {
            const yVal = scatter_state.getValueOfField(scatter_state.chartScale.y, d)
            const dy = yVal ? scatter_state.y(yVal) : (scatter_state.svgheight + 100)

            return dy
        }).strength(1))
        .force("collide", d3.forceCollide(5))
        .stop()


    const t = scatter_state.svg.transition()
        .duration(3000);



    for (var i = 0; i < 30; ++i) simulation.tick();

    scatter_state.nodeG.selectAll(".scattter_comp")
        .data(scatter_state.data.incomestatements)
        .join(enter => {
                const g = enter.append("g")
                    .attr("class", "scattter_comp")
                    .attr("transform", d => {
                        const yVal = scatter_state.getValueOfField(scatter_state.chartScale.y, d)
                        const dy = yVal ? scatter_state.y(yVal) : (scatter_state.svgheight + 100)
                        const xVal = scatter_state.getValueOfField(scatter_state.chartScale.x, d)
                        const dx = xVal ? scatter_state.x(xVal) : (scatter_state.svgwidth + 100)
                        return `translate(${dx}, ${dy})`
                    })
                g.each(function (d) {
                    return ScatterPlotUtility.shapeToFormat(d3.select(this), scatter_state.data.getShape(d.key))
                })
                return g.call(enter => enter.transition(t)
                    .attr("transform", d => `translate(${d.x}, ${d.y})`))
            },
            update => update.call(update => update.transition(t)
                .attr("transform", d => `translate(${d.x}, ${d.y})`)),

        )
}