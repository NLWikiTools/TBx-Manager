/**
 * This script is used to deploy files to the wiki.
 * You must have interface-admin rights to use this.
 *
 * ----------------------------------------------------------------------------
 *    Set up:
 * ----------------------------------------------------------------------------
 * 1) Use [[Special:BotPasswords]] to get credentials. Make sure you enable
 *    sufficient permissions.
 * 2) Create a JSON file to store the username and password. This should be
 *    a plain JSON object with keys "username" and "password", see README
 *    file for an example. Save it here in the "bin" directory with file
 *    name "credentials.json".
 *    IMPORTANT: Never commit this file to the repository!
 *
 * ---------------------------------------------------------------------------
 *    Pre-deployment checklist:
 * ---------------------------------------------------------------------------
 * 1) Changes committed and merged to master branch on GitHub repo
 * 2) Currently on master branch, and synced with GitHub repo
 * 3) Version bumped, and that change commited and synced to GitHub repo
 * 3) Run a full build using "npm run build"
 * When all of the above are done ==> you are ready to proceed with deployment
 *
 * --------------------------------------------------------------------------
 *    Usage:
 * --------------------------------------------------------------------------
 * Ensure the pre-deployment steps above are completed, unless you are only
 * deploying to the testwiki (test.wikipedia.org). Then, run this script:
 * In the terminal, enter
 *     node bin/deploy.js
 * and supply the requested details.
 * Notes:
 * - The default summary if not specified is "Updated from repository"
 * - Edit summaries will be prepended with the version number from
 *   the package.json file
 * - Changes to gadget definitions need to be done manually
 */
const fs = require("fs");
const {mwn} = require("mwn");
const {execSync} = require("child_process");
const prompt = require("prompt-sync")({sigint: true});
const {username, password, betausername, betapassword} = require("./credentials.json");

function logError(error) {
	error = error || {};
	console.log(
		(error.info || "Unknown error")+"\n",
		JSON.stringify(error.response||error)
	);
}

// Prompt user for info
const cluster = prompt("> Naar welk cluster moet gedeployed worden [R]egulier/[B]eta: ");
const isRegulier = (cluster.trim().toUpperCase() === "R"||cluster.trim().toUpperCase() === "REGULIER");
console.log(`${isRegulier ? "REGULIER" : "BETA"}-cluster geselecteerd.`);
const wiki = prompt("> Wikipedia subdomein: ");
const beta = prompt("> Is dit een Beta-versie [Y/n]: ");
const isBeta = beta.trim().toUpperCase() !== "N";
console.log(`${isBeta ? "BETA" : "MAIN"} versie van het script wordt bijgewerkt.`);
const message = prompt("> Bewerkingssamenvatting (optioneel): ");

// Extract info for edit summary.
const title = require("../package.json").title;
const version = require("../package.json").version;
const sha = execSync("git rev-parse --short HEAD").toString("utf8").trim();
const editSummary = `${title} bijgewerkt naar versie ${version} (${sha}): ${message || "Bijwerken vanaf GitHub"}`;
console.log(`Bewerkingssamenvatting is: "${editSummary}"`);

const deployments = [
	{file: "loader-gadget.js", target: "MediaWiki:Gadget-TBxManager.js"},
	{file: "core-gadget.js", target: `MediaWiki:Gadget-TBxManager-core${isBeta ? "-beta" : ""}.js`},
	{file: "styles-gadget.css", target: `MediaWiki:Gadget-TBxManager-core${isBeta ? "-beta" : ""}.css`}
];

let api;
if (isRegulier) {
	api = new mwn({
		apiUrl: `https://${wiki}.wikipedia.org/w/api.php`,
		username: username,
		password: password
	});
} else {
	api = new mwn({
		apiUrl: `https://${wiki}.wikipedia.beta.wmcloud.org/w/api.php`,
		username: betausername,
		password: betapassword
	});
}

console.log(`... inloggen als ${username}  ...`);
api.loginGetToken().then(() => {
	prompt("> Druk op [Enter] om het deployen te starten of druk op [Ctrl + C] om af te breken");
	console.log("--- deployment gestart ---");
	const editPromises = deployments.map(deployment => {
		let content = fs.readFileSync("./dist/"+deployment.file, "utf8").toString();
		return api.save(deployment.target, content, editSummary).then((response) => {
			const status = response && response.nochange
				? "━ Niets om bij te werken"
				: "✔ Succesvol opgeslagen";
			console.log(`${status} - ${wiki}:${deployment.target}`);
		}, (error) => {
			console.log(`✘ Opslaan mislukt - ${wiki}:${deployment.target}`);
			logError(error);
		});
	});
	Promise.all(editPromises).then(() => {
		console.log("--- deployment afgerond ---");
	});
}).catch(logError);