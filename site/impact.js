// The single source of truth for the "Our impact" numbers on the flyer.
//
// TO UPDATE A NUMBER: change the `value` below, save, then run
//   node .\site\tools\build-flyers.mjs
// Every language flyer is rewritten with the new figure. You never edit a
// number in more than one place, so translations cannot drift out of sync.
//
// Only the numbers live here. The wording next to each number stays with the
// translations in site/tools/build-flyers.mjs, under `metricLabels`.
export const impactMetrics = Object.freeze([
  Object.freeze({ id: "studentsReached", value: 23737 }),
  Object.freeze({ id: "countries", value: 33 }),
  Object.freeze({ id: "territories", value: 6 }),
  Object.freeze({ id: "languages", value: 7 }),
  Object.freeze({ id: "moreInterestedInStem", value: 85, unit: "percent" }),
  Object.freeze({ id: "learnedToCode", value: 90, unit: "percent" }),
]);

// How each language writes a number: "23,737" in English, "23 737" in French,
// "23.737" in Brazilian Portuguese. Spelled out rather than derived from Intl
// so published wording can never shift when Node updates its locale data.
export const numberFormats = Object.freeze({
  en: Object.freeze({ groupSeparator: ",", percentSpace: "" }),
  es: Object.freeze({ groupSeparator: ",", percentSpace: "" }),
  fr: Object.freeze({ groupSeparator: " ", percentSpace: " " }),
  "pt-br": Object.freeze({ groupSeparator: ".", percentSpace: "" }),
});

export const metricIds = Object.freeze(impactMetrics.map((metric) => metric.id));

export function formatMetric(metric, language) {
  const format = numberFormats[language];
  if (!format) {
    throw new Error(`No number format defined for language "${language}".`);
  }
  if (!Number.isFinite(metric.value)) {
    throw new Error(`Metric "${metric.id}" must be a number so every language can format it.`);
  }
  const grouped = String(metric.value).replace(/\B(?=(\d{3})+(?!\d))/g, format.groupSeparator);
  return metric.unit === "percent" ? `${grouped}${format.percentSpace}%` : grouped;
}

// Pairs each figure with its translated label, in the order shown on the flyer.
export function localizedMetrics(language, labels) {
  return impactMetrics.map((metric) => {
    const label = labels[metric.id];
    if (!label) {
      throw new Error(`Language "${language}" is missing a label for metric "${metric.id}".`);
    }
    return [label, formatMetric(metric, language)];
  });
}
