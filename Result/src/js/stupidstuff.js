var colortable = ["#384883", "#E45D50", "#F9F6E7", "#355A24", "#FDC04E", "#7E2242", "#6980C5", "#70DFDF", "#3DBD86", "#D7F0BC"]
var color_tags_mapping = {
    'Food & Beverage': { color: colortable[0], shape: "circle" },
    'Manufacturing & Industrial': { color: colortable[1], shape: "circle" },
    'Investment': { color: colortable[2], shape: "circle" },
    'Business Products & Services': { color: colortable[3], shape: "circle" },
    'Marketing': { color: colortable[4], shape: "circle" },
    'Healthcare': { color: colortable[5], shape: "circle" },
    'Education': { color: colortable[6], shape: "circle" },
    'Automotive & Transportation': { color: colortable[7], shape: "circle" },
    'Travel & Leisure': { color: colortable[8], shape: "circle" },
    'Mobile & Telecommunications': { color: colortable[9], shape: "circle" },
    'Real Estate & Construction': { color: colortable[0], shape: "square" },
    'Human Resources & Recruiting': { color: colortable[1], shape: "square" },
    'Media & Entertainment': { color: colortable[2], shape: "square" },
    'Financial Services': { color: colortable[3], shape: "square" },
    'Technology': { color: colortable[4], shape: "square" },
    'Non-Profit': { color: colortable[5], shape: "square" },
    'Retail': { color: colortable[6], shape: "square" },
    'Agriculture': { color: colortable[7], shape: "square" },
    'Energy & Utilities': { color: colortable[8], shape: "square" },
    'Other': { color: colortable[9], shape: "square" },
}

class ScatterPlotUtility {

    static mapToFormat(selection, map) {
        switch (map.shape) {
            case "circle":
                selection.append("circle")
                    .attr("r", 50)
                    .attr("cx", 50)
                    .attr("cy", 50)
                    .attr("fill", map.color)
                break;
            case "hollowcircle":
                selection.append("circle")
                    .attr("r", 50)
                    .attr("cx", 50)
                    .attr("cy", 50)
                    .attr("fill", "black")
                    .attr("stroke-width", 15)
                    .attr("stroke", map.color)
                break;
            case "square":
                selection.append("rect")
                    .attr("width", 100)
                    .attr("height", 100)
                    .attr("fill", map.color)
                break;
            case "hollowsquare":
                selection.append("rect")
                    .attr("width", 100)
                    .attr("height", 100)
                    .attr("fill", "black")
                    .attr("stroke-width", 25)
                    .attr("stroke", map.color)
                break;
            default:
                console.error("Something is wrong. Fucked!");
        }
    }

    static shapeToFormat(selection, map) {
        switch (map.shape) {
            case "circle":
                selection.append("circle")
                    .attr("class", "scatternode")
                    .attr("r", 8)
                    .attr("fill", d => map.color)
                break;
            case "hollowcircle":
                selection.append("circle")
                    .attr("class", "scatternode")
                    .attr("r", 8)
                    .attr("fill", "black")
                    .attr("stroke-width", 1.5)
                    .attr("stroke", d => map.color)
                break;
            case "square":
                selection.append("rect")
                    .attr("class", "scatternode")
                    .attr("width", 16)
                    .attr("height", 16)
                    .attr("fill", d => map.color)
                break;
            case "hollowsquare":
                selection.append("rect")
                    .attr("class", "scatternode")
                    .attr("width", 16)
                    .attr("height", 16)
                    .attr("fill", "black")
                    .attr("stroke-width", 1.5)
                    .attr("stroke", d => map.color)
                break;
            default:
                console.error("Something is wrong. Fucked!");


        }
    }
}
