var substringMatcher = function (strs) {
    return function findMatches(q, cb) {
        var matches, substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function (i, str) {
            if (substrRegex.test(str)) {
                matches.push(str);
            }
        });

        cb(matches);
    };
};

$("#searchbox").keypress(function (e) {
    if (event.which == 13) {
        ScatterplotState.selectNode(this.value)
        this.value = ""


    }
})

$('#searchbox-investment').keypress(function (e) {
    if (event.which == 13) {
        if (!addInvestors(this.value)) return
        updateList()
        $(`#chart_div [data-in='${this.value}']`)
            .addClass("svg_selected")
            .attr("data-selected", "1");
        this.value = ""

    }

})

