class DetailsData {
    misc;
    locations;
    incomestatements;
    details;
    constructor() {

    }

    receiveFromScatter(data) {
        this.incomestatements = data[0]
        this.locations = data[1]
        this.misc = data[2]
    }

    ready() {
        if (this.misc && this.locations && this.incomestatements) return true
        return false
    }

    getRevenue(displayName) {
        const b = this.incomestatements.filter(v => v.displayName === displayName)
        if (b.length === 0) return undefined
        const len = b.length
        return +b[len - 1].revenueUSD
    }

    getMarketCap(displayName) {
        const f = this.misc.find(v => v.displayName === displayName)
        if (!f) return undefined
        return f.stocksSummary
    }

    getCompanyType(displayName) {
        const f = this.misc.find(v => v.displayName === displayName)
        if (!f) return undefined
        return f.companyType || "N/A"
    }

    getCompanyYear(displayName) {
        const f = this.misc.find(v => v.displayName === displayName)
        if (!f) return "N/A"
        return f.foundedYear || "N/A"
    }

    getCompanyHq(displayName) {
        const f = this.locations.find(v => v.displayName === displayName && v.hq === "True")
        if (!f) return "N/A"
        return `${f.city}, ${f.state}, ${f.country}`
    }

    getHomepage(displayName) {
        const f = this.details.find(v => v.displayName === displayName)
        if (!f) return "N/A"
        return `${f.homepage || "N/A"}`
    }

    getEmployeeNumber(displayName) {
        const f = this.details.find(v => v.displayName === displayName)
        if (!f) return "N/A"
        const array = f.employees
        if (array.length == 0) return "N/A"
        return `${d3.format(",")(array[array.length - 1].employeeNumber)}`
    }

    getDescription(displayName) {
        const f = this.details.find(v => v.displayName === displayName)
        if (!f) return "N/A"
        return `${f.longDescription || "N/A"}`
    }


}
class DetailsState {
    constructor() {
        this.current = ""
        this.data = new DetailsData()
    }

    static select(displayName) {
        if (!DetailsState.state.data.ready()) return console.log("not ready")
        DetailsState.state.current = displayName
        DetailsState.state.updateDetails(displayName)
    }
    
    static reset() {
        DetailsState.state.current = ""
        DetailsState.state.resetDetails()
    }

    updateDetails(displayName) {
        $("#companyName").html(displayName)
        $("#revenue").html(this.format(this.data.getRevenue(displayName)))
        $("#marketcap").html(this.format(this.data.getMarketCap(displayName)))
        $("#companytype").html(`Founded: ${this.upper(this.data.getCompanyType(displayName))}`)
        $("#companyyear").html(`Type: ${this.data.getCompanyYear(displayName)}`)
        $("#companyhq").html(`HQ: ${this.data.getCompanyHq(displayName)}`)
        $("#companywebsite").html(`Website: <a href=${this.data.getHomepage(displayName)}>${this.data.getHomepage(displayName)}</a>`)
        $("#companyemployee").html(`Employee: ${this.data.getEmployeeNumber(displayName)}`)
        $("#companydescription").html(`Description: <br>
        ${this.data.getDescription(displayName)}`)

    }

    resetDetails() {
        $("#companyName").html("&nbsp;")
        $("#revenue").html("&nbsp;")
        $("#marketcap").html("&nbsp;")
        $("#companytype").html(`Founded: `)
        $("#companyyear").html(`Type: `)
        $("#companyhq").html(`HQ: `)
        $("#companywebsite").html(`Website: `)
        $("#companyemployee").html(`Employee: `)
        $("#companydescription").html(`Description: `)

    }
    upper(str) {
        return str.replace(/^\w/, function (chr) {
            return chr.toUpperCase();
        });
    }

    format(number) {
        if (!number) return "N/A"
        let n = number
        let str = ""
        while (true) {
            if (n / 1000 >= 1) {
                n = n / 1000
                switch (str) {
                    case "":
                        str = "Thousand"
                        break;
                    case "Thousand":
                        str = "Million"
                        break
                    case "Million":
                        str = "Billion"
                        break
                    default:
                        break;
                }
            } else break
        }
        return `$${n.toFixed(1)} ${str}`
    }

    static state = new DetailsState()
}

d3.json("./data/details.json").then(data => {
    DetailsState.state.data.details = data
})