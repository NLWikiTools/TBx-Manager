import { mw } from "../globals";
// <nowiki>
/* ========== Venue class ====================================================================
   Each instance represents an XfD venue, with properties/function specific to that venue
   ---------------------------------------------------------------------------------------------- */
// Constructor
/**
 *
 * @param {String} type
 * @param {Object} settings
 */
var Venue = function(type, settings) {
	this.type = type;
	for ( var key in settings ) {
		this[key] = settings[key];
	}
};
// ---------- Venue prototype  --------------------------------------------------------------- */
Venue.prototype.hasNomTemplate = function(wikitext) {
	var pattern = new RegExp(this.regex.nomTemplate);
	return pattern.test(wikitext);
};
Venue.prototype.removeNomTemplate = function(wikitext) {
	var pattern = new RegExp(this.regex.nomTemplate);
	var matches = wikitext.match(pattern);
	if ( !matches ) {
		return wikitext;
	}
	if ( matches.length > 1 ) {
		throw new Error("Multiple nomination templates on page");
	}
	return wikitext.replace(pattern, "");
};
Venue.prototype.updateNomTemplateAfterRelist = function(wikitext, today, sectionHeader) {
	var matches = wikitext.match(this.regex.relistPattern);
	if ( !matches ) {
		return wikitext;
	}
	if ( matches.length > 1 ) {
		throw new Error("Multiple nomination templates on page");
	}
	return wikitext.replace(
		this.regex.relistPattern,
		this.wikitext.relistReplace
			.replace("__TODAY__", today)
			.replace("__SECTION_HEADER__", sectionHeader)
	);
};
// ---------- Venue-specific instances  ----------------------------------------------------------- */
// TFD
Venue.Tfd = () => {
	let tfdVenue = new Venue("tfd", {
		path:		 "Wikipedia:Te beoordelen sjablonen/",
		subpagePath: "Wikipedia:Te beoordelen sjablonen/",
		ns_number:	 [10, 828],
		html: {
			head:			"h4",
			list:			"ul",
			listitem:		"li",
			nthSpan:		"1"
		},
		wikitext: {
			closeTop:		"{{subst:Tfd top|'''__RESULT__'''}}__TO_TARGET____RATIONALE__ __SIG__",
			closeBottom:	"{{subst:Tfd bottom}}",
			oldXfd:			"{{oldtfdfull|date= __DATE__ |result=__RESULT__ |disc=__SECTION__}}\n",
			pagelinks:		"* {{tfd links|__PAGE__}}\n",
			relistReplace:	"Wikipedia:Templates for discussion/Log/__TODAY__#",
			alreadyClosed:	"<!-- Tfd top -->"
		},
		regex: {
			nomTemplate:	/(<noinclude>[\n\s]*)?{{(?:Sjabloonweg|)\/dated[^{}]*(?:{{[^}}]*}}[^}}]*)*?}}([\n\s]*<\/noinclude>)?(\n)?/gi,
			relistPattern:	/Wikipedia:Templates(_|\s){1}for(_|\s){1}discussion\/Log\/\d{4}(_|\s){1}\w*(_|\s){1}\d{1,2}#(?=[^}]*}{2})/gi
		},
		holdingCellSectionNumber: {
			"review":			3,
			"merge-infobox":	5,
			"merge-navigation":	6,	// (geography, politics and governance)
			"merge-link":		7,
			"merge-other":		8,
			"merge-meta":		9,
			"convert":			10,
			"substitute":		11,
			"orphan":			12,
			"ready":			13	// (ready for deletion)
		},
		relistTasks:		["UpdateOldLogPage", "UpdateNewLogPage", "UpdateNomTemplates"]
	});
	// Override prototype
	tfdVenue.removeNomTemplate = function(wikitext) {
		var pattern = new RegExp(tfdVenue.regex.nomTemplate);
		var matches = wikitext.match(pattern);
		if ( !matches ) {
			return wikitext;
		}
		if ( matches.length > 1 ) {
			throw new Error("Multiple nomination templates on page");
		}
		var tags = pattern.exec(wikitext);
		if ( !tags ) {
			return wikitext;
		}
		var logical_xor = function(first, second) {
			return (first ? true : false) !== (second ? true : false);
		};
		var unbalancedNoincludeTags = logical_xor(tags[1], tags[2]);
		var replacement = ( unbalancedNoincludeTags ) ? "$1$2" : "";
		return wikitext.replace(pattern, replacement);
	};
	tfdVenue.updateNomTemplateAfterRelist = function(wikitext, today, sectionHeader) {
		var matches = wikitext.match(tfdVenue.regex.relistPattern);
		if ( !matches ) {
			return wikitext;
		}
		if ( matches.length > 1 ) {
			throw new Error("Meerdere nominatiesjablonen op de pagina");
		}
		return wikitext.replace(
			tfdVenue.regex.relistPattern,
			tfdVenue.wikitext.relistReplace
				.replace("__TODAY__", today)
				.replace("__SECTION_HEADER__", sectionHeader)
		);
	};
	return tfdVenue;
};
// AFD
Venue.Afd = transcludedOnly => new Venue("afd", {
	type:		 "afd",
	path:		 "Wikipedia:Te beoordelen pagina's",
	subpagePath: "Wikipedia:Te beoordelen pagina's/",
	hasIndividualSubpages: true,
	ns_number:	 [0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 15, 100, 101, 829, 2300, 2301, 2302, 2303],
	ns_logpages: 4, // Wikipedia
	ns_unlink:   ["0", "100"], // Hoofd, Portaal
	html: {
		head:			"h2",
		list:			"ul",
		listitem:		"li",
		nthSpan:		"1"
	},
	wikitext: {
		closeTop:		"{{Su}}",
		closeBottom:	"{{subst:Ab|'''__RESULT__''' - __TO_TARGET____RATIONALE__}}\n{{einde}}",
		mergeFrom:		"{{Afd-merge from|__NOMINATED__|__DEBATE__|__DATE__}}\n",
		mergeTo:		"{{Afd-merge to|__TARGET__|__DEBATE__|__DATE__}}\n",
		alreadyClosed:	"<!--Template:Afd bottom-->"
	},
	regex: {
		nomTemplate:	/(?:{{(?:wiu|ne|wb|auteur|reclame|weg|verwijderen)(?:.|\n)*?}})\s*/g
	},
	transcludedOnly:	transcludedOnly,
	relistTasks:		["UpdateDiscussion", "UpdateOldLogPage", "UpdateNewLogPage"]
});

Venue.newFromPageName = function(pageName) {
	// Create xfd venue object for this page
	if ( pageName.includes("Wikipedia:Te beoordelen categorieën") ) {
		return Venue.Cfd();
	} else if ( pageName.includes("Wikipedia:Te beoordelen afbeeldingen") ) {
		return Venue.Ffd();
	} else if ( pageName.includes("Wikipedia:Te beoordelen sjablonen") ) {
		return Venue.Tfd();
	} else if ( pageName.includes("Wikipedia:Te beoordelen pagina's") ) {
		return Venue.Afd();
	} else {
		switch(mw.Title.newFromText(pageName).getNamespaceId()) {
		case 6:
			return Venue.Ffd();
		case 10:
		case 828:
			return Venue.Tfd();
		case 14:
			return Venue.Cfd();
		default:
			return Venue.Afd();
		}
	}
};

export default Venue;
// </nowiki>