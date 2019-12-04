$(document).on("click", ".nav-pills .nav-item .nav-link", function (event) // Go to story (anchor handler)
  {
    console.log(this.getAttribute("href"))
    $(".left-sidebar").addClass("none")
    switch (this.getAttribute("href")) {
      case "#pills-overview":
        $("#lsidebar-overview").removeClass("none")
        $("#pills-tab > li:nth-child(1)").attr("style", "opacity: 1")
        break;
      case "#pills-funding":
        $("#lsidebar-funding").removeClass("none")
        $("#pills-tab > li:nth-child(1)").attr("style", "opacity: 0")
        break;
      case "#pills-acquisition":
        $("#lsidebar-acquisition").removeClass("none")
        $("#pills-tab > li:nth-child(1)").attr("style", "opacity: 1")
        break;
      default:
        $("#lsidebar-overview").removeClass("none")
        $("#pills-tab > li:nth-child(1)").attr("style", "opacity: 1")

    }
  });