import TaskItemController from "../TaskItemController";
import { rejection, moduleToDoc, docToModule } from "../../util";
import config from "../../config";
// <nowiki>

export default class UpdateNewLogPage extends TaskItemController {
	constructor(model, widgets) {
		super(model, widgets);
		this.model.setName(`Link in nominatie-${model.discussion.pages.length > 1 ? "sjablonen" : "sjabloon"} bijwerken`);
	}

	transform(page) {
		if ( this.aborted ) return rejection("aborted");

		// Check there's a corresponding nominated page
		const pageName = this.model.getResolvedPageNames().find(pagename => pagename === docToModule(page.title));
		if ( !pageName ) {
			return rejection("unexpectedTitle");
		}
		// Check corresponding page exists
		if ( page.missing ) {
			return rejection("doesNotExist");
		}
		let updatedWikitext;
		try {
			updatedWikitext = this.model.venue.updateNomTemplateAfterRelist(
				page.content,
				this.model.discussion.relistInfo.today,
				this.model.discussion.sectionHeader
			);
		} catch(e){
			return rejection("couldNotUpdate", e);
		}
		if ( updatedWikitext === page.content ) {
			return rejection("nominationTemplateNotFound");
		}
		
		return {
			text: updatedWikitext,
			summary: `Bijwerken ${this.model.venue.type.toUpperCase()}-sjabloon: nominatie is verlengt ${config.script.advert}`
		};
	}

	doTask() {
		if ( this.aborted ) return rejection("aborted");

		const pageNames = this.model.getResolvedPageNames().map(moduleToDoc);
		this.model.setTotalSteps(pageNames.length);
		this.model.setDoing();
		return this.api.editWithRetry(
			pageNames,
			null,
			page => this.transform(page),
			() => this.model.trackStep(),
			(code, error, title) => this.handlePageError(code, error, title)
		).catch(
			(errortype, code, error) => this.handleOverallError(errortype, code, error)
		);
	}
}
// </nowiki>