/*
Initial code from: https://celestialprogramming.com/meeus-illuminated_fraction_of_the_moon.html
Greg Miller gmiller@gregmiller.net 2021
http://www.celestialprogramming.com/

Modifications made:
- caculate only 2 days worth to determine direction
- format object output for re-use in later function
- created and run setup so that we modify our moon display on page load
*/

function JulianDateFromUnixTime(t) {
  //Not valid for dates before Oct 15, 1582
  return (t / 86400000) + 2440587.5;
}

function UnixTimeFromJulianDate(jd) {
  //Not valid for dates before Oct 15, 1582
  return (jd - 2440587.5) * 86400000;
}

function constrain(d) {
  let t = d % 360;
  if (t < 0) t += 360;
  return t;
}

function getIlluminatedFractionOfMoon(jd) {
  const toRad = Math.PI / 180.0;
  const T = (jd - 2451545) / 36525.0;

  const D = constrain(
    297.8501921 + 445267.1114034 * T - 0.0018819 * T * T +
      1.0 / 545868.0 * T * T * T - 1.0 / 113065000.0 * T * T * T * T,
  ) * toRad; //47.2
  const M = constrain(
    357.5291092 + 35999.0502909 * T - 0.0001536 * T * T +
      1.0 / 24490000.0 * T * T * T,
  ) * toRad; //47.3
  const Mp = constrain(
    134.9633964 + 477198.8675055 * T + 0.0087414 * T * T +
      1.0 / 69699.0 * T * T * T - 1.0 / 14712000.0 * T * T * T * T,
  ) * toRad; //47.4

  //48.4
  const i = constrain(
    180 - D * 180 / Math.PI - 6.289 * Math.sin(Mp) + 2.1 * Math.sin(M) -
      1.274 * Math.sin(2 * D - Mp) - 0.658 * Math.sin(2 * D) -
      0.214 * Math.sin(2 * Mp) - 0.11 * Math.sin(D),
  ) * toRad;

  const k = (1 + Math.cos(i)) / 2;
  return k;
}

// get the percentange of the moon that is illuminated given at a number of days in the
function getIlluminatedPercentageDaysFromNow(days_in_future = 0) {
  const t = new Date().getTime();
  const jd = JulianDateFromUnixTime(t);

  const percentage = Math.round(
    getIlluminatedFractionOfMoon(jd + days_in_future) * 100,
  );
  return percentage;
}

// get our directina and percentage in one convenient function
const moon_percent_and_direction = () => {
  const today_percent = getIlluminatedPercentageDaysFromNow(0);
  const tomorrow_percent = getIlluminatedPercentageDaysFromNow(1);
  const direction = today_percent - tomorrow_percent < 0 ? "waxing" : "waning";

  return { direction: direction, percentage: today_percent };
};

// set the moon up on real page
function setup_moon() {
  onload = () => {
    const moon_stats = moon_percent_and_direction();

    const moon = document.getElementById("moon");
    let moon_description = moon_stats.direction + " crescent moon";
    if (moon.percentage > 50) {
      moon_description = moon_stats.direction + " gibbous moon";
    }
    if (moon_stats.percentage <= 1) {
      moon_description = "new moon";
    }
    if (moon_stats.percentage >= 99) {
      moon_description = "full moon";
    }

    moon.title =
      `It is a ${moon_description}, which is ${moon_stats.percentage}% full. Click to toggle theme.`;

    moon.style.setProperty("--moon_percent", moon_stats.percentage);
    if (moon_stats.direction == "waxing") {
      moon.classList = "moon moon_increasing";
    } else {
      moon.classList = "moon moon_decreasing";
    }
  };
}

setup_moon();
