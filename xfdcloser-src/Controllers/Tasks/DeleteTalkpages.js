import { mw } from "../../../globals";
import TaskItemController from "../TaskItemController";
import { rejection, makeLink } from "../../util";
// <nowiki>

export default class DeleteTalkpages extends TaskItemController {
	constructor(model, widgets) {
		super(model, widgets);
		this.model.setName(`Verwijderen overleg${model.pageNames.length > 1 ? "pagina's" : "pagina"}`);
	}

	/**
	 * Verify page existence and speedy deletion eligibility; add a warning if verfication fails
	 * @param {String} pageName
	 * @returns {Boolean} page exists and is eligibile for speedy deletion
	 */
	verifyPage(pageName) {
		const title = mw.Title.newFromText(pageName);
		const isUserTalkBasePage = ( title.getNamespaceId() === 3 ) && ( !pageName.includes("/") );

		if ( !title.exists() ) {
			this.model.addWarning(
				`${makeLink(pageName)} overgeslagen: pagina bestaat niet (mogelijk is hij al verwijderd)`
			);
			this.model.trackStep("skipped");
			return false;
		} else if ( isUserTalkBasePage ) {
			this.model.addWarning(
				`${makeLink(pageName)} overgeslagen: gebruikersoverlegpagina's kunnen niet met TBx-Manager verwijderd worden`
			);
			this.model.trackStep("skipped");
			return false;
		}
		return true;
	}

	doTask() {
		const talkPages = this.model.getResolvedTalkpagesNames();
		if ( talkPages.length === 0 ) {
			this.model.addWarning("Niet gevonden");
			return rejection();
		}
		this.model.setTotalSteps(talkPages.length);
		const talkPagesToDelete = talkPages.filter(pageName => this.verifyPage(pageName));

		this.model.setDoing();
		return this.api.deleteWithRetry(
			talkPagesToDelete,
			{ reason: this.model.getEditSummary({prefix: ""}) },
			() => this.model.trackStep(),
			(code, error, title) => this.handlePageError(code, error, title, "delete")
		).catch(
			(errortype, code, error) => { this.handleOverallError(errortype, code, error); }
		);
	}
}
// </nowiki>