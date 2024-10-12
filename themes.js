const SUN = "Sun"
// black on white
const BW = "BoW"
const MOON = "Moon"
// whtie on black
const WB = "WoB"

// code to handle setting theme and updating theme related things
function setInitialTheme() {
  let theme = localStorage.getItem("theme");
  // if no custom theme selected for site
  if ((theme != BW && theme != WB) || theme == null) {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      localStorage.setItem("theme", WB);
    } else {
      localStorage.setItem("theme", BW);
    }
  }
  theme = localStorage.getItem("theme");
  let html = document.querySelector("html");
  html.classList = [theme];
  // Set the theme regardless of if its default on load of the page,
  // won't be able to find the celestial if it the page doesn't exist
  onload = () => {
    let celestial = document.getElementsByClassName("sun")[0];
    // if (theme == "light") { celestial.textContent = WB; }
    if (theme == BW) { celestial.textContent = WB; }
    // if (theme == "dark") { celestial.textContent = BW; }
    if (theme == WB) { celestial.textContent = BW; }
    // defualt to sun
    // else { celestial.textContent = SUN; }
  };
}

setInitialTheme();
const themeToDisplay = {
  WB: "dark",
  BW: "light",
}
const displayToTheme = {
  "dark": WB,
  "light": BW,
}

const themes = {
  WB: BW,
  BW: BW,
}

const set_theme = (new_theme) => {
  let html = document.querySelector("html");
  html.classList = [new_theme];
  localStorage.setItem("theme", new_theme);
}

// is sun? should be sun?
cycle_theme = () => {
  let celestial = document.getElementsByClassName("sun")[0];
  // if (celestial.textContent === SUN) {
  //   set_theme(SUN);
  //   celestial.textContent = WB;
  // }
  if (celestial.textContent === BW) {
    set_theme(BW);
    celestial.textContent = WB; // always loop back to sun
  }
  // else if (celestial.textContent === MOON) {
  //   set_theme(MOON);
  //   celestial.textContent = BW;
  // }
  else if (celestial.textContent === WB) {
    set_theme(WB);
    celestial.textContent = BW; // always loop back to sun
  }
};
