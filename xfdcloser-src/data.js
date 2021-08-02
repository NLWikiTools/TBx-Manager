/**
 * Static data
 */
// <nowiki>
const resultsData = [
	// Keep
	{
		name: "keep",
		label: "Behouden",
		title: "Sluit beoordeling met resultaat \"behouden\"",
		allowSpeedy: true,
		venues: ["afd", "cfd", "ffd", "tfd"],
		actions: ["updatePages", "noActions"]
	},

	// Delete
	{
		name: "delete",
		label: "Verwijderen",
		title: "Sluit beoordeling met resultaat \"verwijderen\"",
		allowSpeedy: true,
		sysopOnly: true,
		venues: ["afd", "cfd", "ffd", "tfd"],
		actions: ["deletePages", "noActions"]
	},

	// Redirect
	{
		name: "redirect",
		label: "Doorverwijzen",
		title: "Sluit beoordeling met resultaat \"doorverwijzing\"",
		requireTarget: true,
		allowDeleteFirst: true,
		sysopOnly: true,
		venues: ["afd", "tfd"],
		actions: ["redirectAndUpdate", "noActions"]
	},

	// Rename
	{
		name: "rename",
		label: "Hernoemen",
		title: "Sluit beoordeling met resultaat \"hernoemen\"",
		requireTarget: true,
		venues: ["cfd"],
		actions: ["noActions"]
	}
];

const actions = [
	{
		label: "Verwijder nominatiesjabloon",
		name: "updatePages"
	},
	{
		label: "Verwijder pagina",
		name: "deletePages",
		options: ["deleteTalk", "deleteRedir", "unlink"]
	},
	{
		label: "Maak doorverwijzing",
		name: "redirectAndUpdate",
	},
	{
		label: "Geen geautomatiseerde handelingen",
		name: "noActions",
	}
];

const options = [
	{
		name: "deleteTalk",
		label: "Verwijder overlegpagina",
		type: "toggleSwitch",
		venues: ["afd", "cfd", "ffd", "mfd", "rfd", "tfd"],
		sysopOnly: true,
		value: true // initial value
	},
	{
		name: "deleteRedir",
		label: "Verwijder doorverwijzingen",
		type: "toggleSwitch",
		venues: ["afd", "cfd", "ffd", "mfd", "tfd"],
		value: true // initial value
	},
	{
		name: "unlink",
		label: "Ontlinken",
		type: "toggleSwitch",
		for: "deletePages",
		venues: ["afd", "ffd"],
		value: true // initial value
	}
];

const prefs = [{
	name: "beta",
	label: "Schakel beta-versie in",
	type: "toggle",
	help: "Pagina moet opnieuw geladen worden om effect te hebben.",
	helpInline: true,
	default: false
}, {
	name: "watchlist",
	label: "Voeg bewerkte pagina's toe aan volglijst",
	type: "dropdown",
	options: [{
		data: "preferences",
		label: "Standaard"
	}, {
		data: "watch",
		label: "Altijd"
	}, {
		data: "nochange",
		label: "Nooit"
	}],
	help: "Standaard wordt gebruik gemaakt van de instelling zoals opgegeven op Speciaal:Voorkeuren § Volglijst",
	default: "preferences"
}, {
	name: "unlinkBacklinks",
	label: "Schakel ontlinken standaard in",
	sysopOnly: true,
	type: "toggle",
	default: true
}, {
	name: "collapseWarnings",
	label: "Klap taak-waarschuwingen bij meer dan:",
	type: "number",
	min: 2,
	default: 5
}, {
	name: "collapseErrors",
	label: "Klap taak-fouten bij meer dan:",
	type: "number",
	min: 2,
	default: 5
}];

const defaultPrefValues = prefs.reduce((accumulated, currentPref) => {
	accumulated[currentPref.name] = currentPref.default;
	return accumulated;
}, {});

/**
 * @param {String} venueType type of venue, e.g. "afd"
 * @param {Boolean} userIsSysop
 * @returns {function(Object): boolean} 
 */
const isRelevant = (venueType, userIsSysop) => data => (
	(!Array.isArray(data.venues) || data.venues.includes(venueType)) &&
	(data.sysopOnly ? userIsSysop : true) &&
	(data.nonSysopOnly ? !userIsSysop : true)
);

/**
 * Get the resultsData filtered by venue and sysop stasus
 * 
 * @param {String} venueType type of venue, e.g. "afd"
 * @param {Boolean} userIsSysop 
 * @returns {Object[]} relevant resultsData
 */
const getRelevantResults = function(venueType, userIsSysop) {
	return resultsData.filter(isRelevant(venueType, userIsSysop));
};

/**
 * @param {String} venueType type of venue, e.g. "afd"
 * @param {Boolean} userIsSysop
 * @param {String} result
 * @returns {Object[]} relevant actions with only relevant options
 */
const getRelevantActions = function(venueType, userIsSysop, result) {
	const resultData = getRelevantResults(venueType, userIsSysop).find(resData => resData.name === result);
	if ( !resultData ) {
		console.log("No results data for", {venueType, userIsSysop, result});
		
	}
	return actions.filter(action => resultData.actions.includes(action.name));
};

/**
 * @param {String} venueType type of venue, e.g. "afd"
 * @param {Boolean} userIsSysop
 * @param {String} result
 * @returns {Object[]} relevant actions with only relevant options
 */
const getRelevantOptions = function(venueType, userIsSysop, actions) {
	const actionOptions = actions.flatMap(action => action.options || []);
	return options.filter(option => (
		actionOptions.includes(option.name) && isRelevant(venueType, userIsSysop)(option)
	)).map(option => ({...option})); // Make copies of objects, so the originals here are not touched
};

/**
 * 
 * @param {Boolean} userIsSysop
 * @returns {Object[]} relevant prefs
 */
const getRelevantPrefs = function(userIsSysop) {
	return prefs.filter(isRelevant(null, userIsSysop));
};

export { getRelevantResults, getRelevantActions, getRelevantOptions, getRelevantPrefs };

export { resultsData, actions, options, prefs, defaultPrefValues };
// </nowiki>
