$(document).on("click", ".nav-pills .nav-item .nav-link", function (event) // Go to story (anchor handler)
  {
    console.log(this.getAttribute("href"))
    $(".left-sidebar").addClass("none")
    switch (this.getAttribute("href")) {
      case "#pills-overview":
        $("#lsidebar-overview").removeClass("none")
        break;
      case "#pills-funding":
        $("#lsidebar-funding").removeClass("none")
        break;
      case "#pills-acquisition":
        $("#lsidebar-acquisition").removeClass("none")
        break;
      default:
        $("#lsidebar-overview").removeClass("none")
    }
  });