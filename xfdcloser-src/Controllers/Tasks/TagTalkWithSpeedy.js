import { $, mw } from "../../../globals";
import TaskItemController from "../TaskItemController";
import { rejection, makeLink } from "../../util";
// <nowiki>

export default class TagTalkWithSpeedy extends TaskItemController {
	constructor(model, widgets) {
		super(model, widgets);
		this.model.setName(`Nomineren overleg${model.pageNames.length > 1 ? "pagina's" : "pagina"}`);
	}

	verifyPage(pageName) {
		const title = mw.Title.newFromText(pageName);
		const isUserTalkBasePage = title.getNamespaceId() === 3 && !pageName.includes("/");
		if ( !title.exists() ) {
			this.model.addWarning(
				`${makeLink(pageName)} overgeslagen: pagina bestaat niet (mogelijk is hij al verwijderd)`
			);
			this.model.trackStep("skipped");
			return false;
		}
		if ( isUserTalkBasePage ) {
			this.model.addWarning(
				`${makeLink(pageName)} overgeslagen: gebruikersoverlegpagina's kunnen niet met TBx-Manager verwijderd worden`
			);
			this.model.trackStep("skipped");
			return false;
		}
		return true;
	}

	transform(/* page */) {
		if ( this.aborted ) return rejection("aborted");
		return {
			prependtext: "{{nuweg|1=Weesoverlegpagina}}\n",
			summary: this.model.getEditSummary({short:true, prefix: "Verzoek om directe verwijdering, per"}),
			nocreate: 1
		};
	}

	doTask() {
		const talkPages = this.model.getResolvedTalkpagesNames();
		if ( talkPages.length === 0 ) {
			this.model.addWarning("Niet gevonden");
			return rejection();
		}
		this.model.setTotalSteps(talkPages.length);

		const talkPagesToTag = talkPages.filter(talkPage => this.verifyPage(talkPage));
		if ( talkPagesToTag.length === 0 ) {
			return $.Deferred().resolve("Skipped");
		}
		this.model.setDoing();
		return this.api.editWithRetry(
			talkPagesToTag,
			null,
			(page) => this.transform(page),
			() => this.model.trackStep(),
			(code, error, title) => this.handlePageError(code, error, title)
		).catch(
			(errortype, code, error) => this.handleOverallError(errortype, code, error)
		);
	}
}
// </nowiki>