import { $, OO } from "../../globals";
import ResultPanelController from "../Controllers/ResultPanelController";
import ResultListWidget from "./ResultListWidget";
import SingleResultWidget from "./SingleResultWidget";
// <nowiki>

/**
 * @class ResultPanel
 * @description Base class for result form, with common elements for the more specifc result form classes.
 * @param {Object} config
 * @param {String} config.sectionHeader Discussion section header
 * @param {Boolean} config.isBasicMode
 * @param {mw.Title[]} config.pages mw.Title objects for each nominated page
 * @param {String} config.type "close" or "relist"
 * @param {Object} config.user Object with {String}sig, {string}name, {boolean}isSysop
 * @param {String} config.venue code for venue, e.g. "afd"
 * @param {String} config.nomPageLink Nomination page link target, with #section anchor if appropriate
 * @param {jQuery} $overlay element for overlays
 */
function ResultPanel( config, model ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	ResultPanel.super.call( this, config );

	this.model = model;

	// Notes
	this.notesFieldset = new OO.ui.FieldsetLayout();

	// Result(s)
	this.resultFieldset = new OO.ui.FieldsetLayout({label: "Conclusie"});
	// Single-mode result
	this.singleResultWidget = new SingleResultWidget(
		this.model.singleModeResult,
		{ $overlay: config.$overlay }
	);
	this.resultWidgetField = new OO.ui.FieldLayout( this.singleResultWidget, {
		align:"top"
	} );
	// Multimode results
	this.multiResultWidget = new ResultListWidget(
		this.model.multimodeResults,
		{ $overlay: config.$overlay });
	this.multiResultWidgetField = new OO.ui.FieldLayout( this.multiResultWidget, {
		align:"top"
	} );
	this.resultSummary = new OO.ui.TextInputWidget();
	this.resultSummaryField = new OO.ui.FieldLayout( this.resultSummary, {
		label: $("<strong>").text("Samenvatting"),
	} );
	this.resultFieldset.addItems([
		this.resultWidgetField,
		this.multiResultWidgetField,
		this.resultSummaryField
	]);

	// Rationale
	this.rationaleFieldset = new OO.ui.FieldsetLayout();
	this.copyButton = new OO.ui.ButtonWidget( {
		label: "Kopieer van hierboven",
		framed: false
	} );
	this.rationaleTextbox = new OO.ui.MultilineTextInputWidget( {
		rows: 3
	} );
	this.rationaleWidget = new OO.ui.Widget();
	this.rationaleWidget.$element.append(
		this.copyButton.$element,
		this.rationaleTextbox.$element
	);
	this.rationaleFieldset.addItems([
		new OO.ui.FieldLayout( this.rationaleWidget, {
			align:"top"
		} )
	]);

	// Preview
	this.previewFieldset = new OO.ui.FieldsetLayout({label: "Voorvertoning"});
	this.preview = new OO.ui.Widget();
	this.preview.$element.css({
		"border":"2px dashed #ccc",
		"border-radius":"5px",
		"padding":"5px"
	});
	this.previewFieldset.addItems([
		new OO.ui.FieldLayout( this.preview, {
			align: "top"
		})
	]);

	this.$element.append(
		this.notesFieldset.$element,
		this.resultFieldset.$element,
		this.rationaleFieldset.$element,
		this.previewFieldset.$element
	).children().css({"margin":"1em 0"})
		.first().css({"margin-top":"0"});


	this.controller = new ResultPanelController(this.model, this);
	this.controller.updateFromModel();
}
OO.inheritClass( ResultPanel, OO.ui.PanelLayout );

export default ResultPanel;
// </nowiki>