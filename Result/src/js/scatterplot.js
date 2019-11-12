class CompanyData {
    constructor (dataset) {
        this.incomestatements = dataset[0]
        this.location = dataset[1]
        this.misc = dataset[2]
    }

    getAllLocation() {
        return Object.keys(_(this.location)
        .filter(v => v.hq)
        .map(v => v.country)
        .countBy()
        .pickBy(v => v > 150).value()).concat(["Other", " "])
    }

    getIncomeStatememtsByYear(year) {

    }

    getHqOf(company) {
        return this.location.filter(v=>v.hq).find(v => v.displayName === company)
    }

   getExtentOfRevenue() {
       return d3.extent(this.incomestatements.map(v => +v.revenueUSD))
   }
}

class ScatterplotState {
    constructor (dataset) {
        // dataset

        this.data = new CompanyData(dataset)
        // draw here

        this.svg = d3.select("svg.scatterplot_svg")
        this.margin = { top: 20, right: 20, bottom: 30, left: 40 }
        this.width = 1000 - this.margin.left - this.margin.right
        this.height = 500 - this.margin.top - this.margin.bottom
        this.padding = 1 // separation between nodes
        this.radius = 6
        this.xScale = d3.scalePoint()
            .range([0, this.width]);
        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        this.y = this.yScale.domain(this.data.getExtentOfRevenue())
        this.x = this.xScale.domain([""].concat(this.data.getAllLocation()))
        this.allLocationsCat = this.data.getAllLocation()

        this.svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
            .call(d3.axisLeft(this.y).tickFormat(d3.format(".2s")));

        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(${this.margin.left},${500 - this.margin.bottom})`)
            .call(d3.axisBottom(this.x));

    }
}
var scatter_state;

Promise.all([d3.csv("./data/incomestatements.csv"), d3.csv("./data/locations.csv"), d3.csv("./data/misc.csv")])
.then(function (data){
    scatter_state = new ScatterplotState(data)
    const node = scatter_state.svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr('transform', `translate(${scatter_state.margin.left},${scatter_state.margin.top})`)
        .selectAll("circle")
        .data(scatter_state.data.incomestatements, (data) => data.displayName)
        .join("circle")
        .attr("r", 5)
        .attr("fill", "orange")
        .attr('cy', d => scatter_state.y(+d.revenueUSD))
        .attr('cx', (d) => {
            if (d.revenueUSD > 900000000000) console.log(d)
            const located = scatter_state.data.getHqOf(d.displayName)
            const locCat = located
                && (scatter_state.allLocationsCat.includes(located.country))
                ? located.country : "Other"
            return scatter_state.x(locCat)
        })

})
