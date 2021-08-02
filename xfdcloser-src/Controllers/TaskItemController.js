import { $, OO } from "../../globals";
import { makeLink, rejection } from "../util";
import API from "../api";
import * as prefs from "../prefs";
// <nowiki>

function toSmallSnippet(content) {
	return new OO.ui.HtmlSnippet(
		`<span style="font-size: 88%; font-weight: normal;">${content}</span>`
	);
}

/**
 * @abstract
 * @class
 */
class TaskItemController {
	constructor(model, widget) {
		this.model = model;
		this.widget = widget;
		this.api = API;
		this._doingTask = false;

		this.model.connect(this, {update: "updateFromModel"});
		
		if (this.widget.showAllWarningsButton && this.widget.showAllErrorsButton) {
			this.widget.showAllWarningsButton.connect(this, {click: "onShowWarningsButtonClick"});
			this.widget.showAllErrorsButton.connect(this, {click: "onShowErrorsButtonClick"});
		}
	}

	makeWarnings() {
		if (this.model.showOverflowWarnings || this.model.warnings.length < prefs.get("collapseWarnings")) {
			return this.model.warnings.map(toSmallSnippet);
		} else {
			return [];
		}
	}
	onShowWarningsButtonClick() {
		this.model.showOverflowWarnings = true;
		this.updateFromModel();
	}

	makeErrors() {
		if (this.model.showOverflowErrors || this.model.errors.length < prefs.get("collapseErrors")) {
			return this.model.errors.map(toSmallSnippet);
		} else {
			return [];
		}
	}
	onShowErrorsButtonClick() {
		this.model.showOverflowErrors = true;
		this.updateFromModel();
	}

	updateFromModel() {
		this.widget.field.setLabel(
			new OO.ui.HtmlSnippet(`<span>${this.model.label}</span>`)
		);
		this.widget.progressbar.setProgress(this.model.progress);
		this.widget.progressbar.toggle(this.model.showProgressBar);
		this.widget.field.setNotices(this.model.notices.map(toSmallSnippet));
		this.widget.field.setWarnings(this.makeWarnings());
		this.widget.field.setErrors(this.makeErrors());
		if (this.widget.showAllWarningsButton && this.widget.showAllErrorsButton) {
			this.widget.showAllWarningsButton.toggle(!this.model.showOverflowWarnings && this.model.warnings.length >= prefs.get("collapseWarnings"));
			this.widget.showAllWarningsButton.setLabel(`Toon ${this.model.warnings.length} waarschuwingen`);
			this.widget.showAllErrorsButton.toggle(!this.model.showOverflowErrors && this.model.errors.length >= prefs.get("collapseErrors"));
			this.widget.showAllErrorsButton.setLabel(`Toon ${this.model.errors.length} fouten`);
		}
		this.widget.emit("update");

		if ( this.model.starting && !this._doingTask && this.model.canProceed() ) {
			this._doingTask = true;
			this.model.setStarted();
			$.when(this.doTask())
				.then(() => this.model.setDone())
				.catch(() => this.model.setFailed());
		}
	}

	/**
	 * Do the task, and return a promise that is resolved when task is done or
	 * rejected if the task is failed.
	 * @virtual
	 */
	doTask() { throw new Error("doTask method not implemented"); }

	logError(code, error) {
		console.error(`[TBx-Manager/${this.model.taskName}] ${code||"onbekend"}`, error);
	}

	handlePageError(code, error, title, action) {
		action = action || "bewerk";
		switch (code) {
		case "unexpectedTitle":
			this.model.addError(`API-query gaf onverwachte titel ${makeLink(title)}; deze pagina wordt niet bewerkt`);
			this.model.trackStep("failed");
			break;
		case "unexpectedTarget":
			this.model.addError(`API-query gaf onverwachte overlegpagina ${makeLink(title)}; deze pagina wordt niet bewerkt`);
			this.model.trackStep("failed");
			break;
		case "doesNotExist":
			this.model.addError(`${makeLink(title)} bestaat niet, en wordt daarom niet bewerkt`);
			this.model.trackStep("failed");
			break;
		case "couldNotUpdate":
			this.model.addError(`Kan ${makeLink(title)}: ${error.message} niet bijwerken`);
			this.model.trackStep("failed");
			break;
		case "subjectDoesNoteExist":
			this.model.addError(`${makeLink(title)} bestaat niet, en de overlegpagina wordt daarom niet bewerkt`);
			this.model.trackStep("failed");
			break;
		case "targetIsNotModule":
			this.model.addError(`Kan geen doorverwijzing maken voor ${makeLink(title)} omdat ${error && error.target
				? makeLink(error.target)
				: "de doelpagina"
			} geen module is`);
			this.model.trackStep("failed");
			break;
		case "skipped":
			this.model.addWarning(`${makeLink(title)} overgeslagen`);
			this.model.trackStep("skipped");
			break;
		case "skippedNoneFound":
			this.model.addWarning(`${makeLink(title)} overgeslagen: niet gevonden`);
			this.model.trackStep("skipped");
			break;
		case "skippedNoLinks":
			this.model.addWarning(`${makeLink(title)} overgeslagen: geen directe links`);
			this.model.trackStep("skipped");
			break;
		case "noChangesMade":
			this.model.addError(`Geen uit te voeren bewerkingen gevonden voor ${makeLink(title)}`);
			this.model.trackStep("skipped");
			break;
		case "nominationTemplateNotFound":
			this.model.addError(`Geen nominatie-sjabloon gevonden op ${makeLink(title)}`);
			this.model.trackStep("skipped");
			break;
		case "abort":
			this.model.setAborted();
			this.model.trackStep("failed");
			break;
		case "aborted":
			this.model.trackStep("failed");
			break;
		default:
			this.model.addError(`fout ${code||"onbekend"}: kan niet "${action}" op pagina ${makeLink(title)}`);
			this.model.trackStep("failed");
			this.logError(code, error);
		}
	}

	handleOverallError(errortype, code, error) {
		if (errortype === "read") {
			// "write" errors already handled via #handlePageError
			this.model.addError(`fout ${code||"onbekend"}: Kan de content van de genomineerde ${this.model.discussion.pages.length > 1 ? "pagina's" : "pagina"} niet lezen`);
			this.model.setFailed();
			this.logError(code, error);
			return rejection();
		}
	}
}

export default TaskItemController;
// </nowiki>