// black on white
const BoW = "BoW";
// whtie on black
const WoB = "WoB";

const setTheme = (new_theme) => {
  const html = document.querySelector("html");
  html.classList = [new_theme];
  localStorage.setItem("theme", new_theme);
};

const getTheme = () => {
  return localStorage.getItem("theme");
};

// code to handle setting theme and updating theme related things
function setInitialTheme() {
  const theme = getTheme();

  if (theme) {
    setTheme(theme);
  } else {
    setTheme(WoB);
  }
}

setInitialTheme();

const next_theme = {
  WoB: BoW,
  BoW: WoB,
};

const cycleTheme = () => {
  const theme = getTheme();
  const next = next_theme[theme];
  if (next) setTheme(next);
  else setTheme(WoB);
};
