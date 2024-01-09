// code to handle setting theme and updating theme related things
function setInitialTheme() {
  let theme = localStorage.getItem("theme");
  // if no custom theme selected for site
  if (theme == null) {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      localStorage.setItem("theme", "light");
    } else {
      localStorage.setItem("theme", "dark");
    }
  }
  theme = localStorage.getItem("theme");
  let html = document.querySelector("html");
  html.classList = [theme];
  // Set the theme regardless of if its default on load of the page,
  // won't be able to find the celestial if it the page doesn't exist
  onload = () => {
    let celestial = document.getElementsByClassName("sun")[0].firstChild;
    if (theme == "light") {
      celestial.textContent = "Moon";
    } else {
      celestial.textContent = "Sun";
    }
  };
}

setInitialTheme();

// is sun? should be sun?
toggle_is_sun = () => {
  let celestial = document.getElementsByClassName("sun")[0].firstChild;
  let html = document.querySelector("html");
  if (celestial.textContent === "Sun") {
    html.classList = ["light"];
    localStorage.setItem("theme", "light");
    celestial.textContent = "Moon";
  } else {
    html.classList = [];
    localStorage.setItem("theme", "dark");
    celestial.textContent = "Sun";
  }
};
