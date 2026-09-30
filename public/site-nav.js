// Closes the site bar's Explore menu on Escape or a click outside it.
// The menu works without this script; it is a <details> element.
(function () {
  var menu = document.querySelector(".dl-nav-explore");
  if (!menu) return;
  document.addEventListener("click", function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
})();
