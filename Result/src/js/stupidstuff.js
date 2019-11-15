var colortable = ["#384883", "#E45D50", "#F9F6E7", "#355A24", "#FDC04E"]
var color_tags_mapping = {
    'Food & Beverage': { color: colortable[0], shape: "circle" },
    'Manufacturing & Industrial': { color: colortable[1], shape: "circle" },
    'Investment': { color: colortable[2], shape: "circle" },
    'Business Products & Services': { color: colortable[3], shape: "circle" },
    'Marketing': { color: colortable[4], shape: "circle" },
    'Healthcare': { color: colortable[0], shape: "hollowcircle" },
    'Education': { color: colortable[1], shape: "hollowcircle" },
    'Automotive & Transportation': { color: colortable[2], shape: "hollowcircle" },
    'Travel & Leisure': { color: colortable[3], shape: "hollowcircle" },
    'Mobile & Telecommunications': { color: colortable[4], shape: "hollowcircle" },
    'Real Estate & Construction': { color: colortable[0], shape: "square" },
    'Human Resources & Recruiting': { color: colortable[1], shape: "square" },
    'Media & Entertainment': { color: colortable[2], shape: "square" },
    'Financial Services': { color: colortable[3], shape: "square" },
    'Technology': { color: colortable[4], shape: "square" },
    'Non-Profit': { color: colortable[0], shape: "hollowsquare" },
    'Retail': { color: colortable[1], shape: "hollowsquare" },
    'Agriculture': { color: colortable[2], shape: "hollowsquare" },
    'Energy & Utilities': { color: colortable[3], shape: "hollowsquare" },
    'Other': { color: colortable[4], shape: "hollowsquare" },
}

class ScatterPlotUtility {
    static shapeToFormat(selection, shape) {
        switch (shape) {
            case "circle":
                selection.append("circle")
                    .attr("r", 5)
                    .attr("fill", d => scatter_state.data.getColor(d.key))
                break;
            case "hollowcircle":
                selection.append("circle")
                    .attr("r", 5)
                    .attr("fill", "black")
                    .attr("stroke-width", 1.5)
                    .attr("stroke", d => scatter_state.data.getColor(d.key))
                break;
            case "square":
                selection.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", d => scatter_state.data.getColor(d.key))
                break;
            case "hollowsquare":
                selection.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", "black")
                    .attr("stroke-width", 1.5)
                    .attr("stroke", d => scatter_state.data.getColor(d.key))
                break;
            default:
                console.error("Something is wrong. Fucked!");


        }
    }
}
