require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
//const google = require('./google');
const {google} = require('googleapis');
//process.env.steamuser
//process.env.steampass

async function getSteamStats(head, get) {
	const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: head});
	const page = await browser.newPage();
	await page.goto("https://partner.steampowered.com/");

	await page.type('#username', process.env.steamuser);
	await page.type('#password', process.env.steampass);
	await page.click('#login_btn_signin');
	await page.waitForSelector('.loginAuthCodeModal', {visible: true});

	//Wait for email to be sent
	await page.waitForTimeout(3000);

	let steamcode = await getLastSteamGuard();
	//console.log(steamcode);
	await page.type('#authcode', steamcode);
	await page.click('#auth_buttonset_entercode > div.auth_button.leftbtn');
	
	await page.waitForSelector('#success_continue_btn', {visible: true});
	await page.click('#success_continue_btn');

	await page.waitForSelector('.hr-color');
	var today = new Date().toISOString().substring(0, 10);
	await page.goto("https://partner.steampowered.com/app/details/1411810/?dateStart=2000-01-01&dateEnd=" + today);

	const $ = cheerio.load(await page.evaluate(() => document.querySelector('*').outerHTML));
	
	let stats = [];
	stats.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
	$('#gameDataLeft div:first-child td:nth-child(2)').each(function(i, elem) {
		var val = $(this).text().replace(/\$|\s/gm,'');
		//console.log(i + " : " + val);
		stats.push(val);
	});

	console.log("Success:"+stats.join(','));
	if(get) {
		await browser.close();
		return stats.join(',');
	} else {
		await google.writeToSheets(stats);
		await browser.close();
		return "";
	}

	
}

async function getLastSteamGuard(auth) {
	let steamguardkey = await new Promise(function(resolve) {
		const gmail = google.gmail({version: 'v1', auth});
		gmail.users.messages.list({
			userId: 'me',
			includeSpamTrash: false,
			maxResults: 1,
			q: "from:(noreply@steampowered.com) Here is the Steam Guard code you need to login to account falldeaf"
		}, (err, res) => {
			if (err) return console.log('The API returned an error: ' + err);
				//console.log(res.data.messages[0].id);	

				gmail.users.messages.get({
					userId: 'me',
					id: res.data.messages[0].id,
					format: "raw"
				}, (err, res) => {
					if (err) return console.log('The API returned an error: ' + err);

					let text = Buffer.from(res.data.raw, 'base64').toString('ascii');

					const regex = /<span style="font-size: 24px; color: #66c0f4; font-family: Arial, Helvetica, sans-serif; font-weight: bold;">([A-Z0-9]*)/gm;
					
					//console.log(regex.exec(text)[1]);
					resolve( regex.exec(text)[1] );
						
				});
		});
	});
	//console.log("Inside getlaststeamguard:" + steamguardkey);
	return(steamguardkey);
}

exports.getSteamStats = (req, res) => {
	//Gotta figure out how to auth gmail from Gfunctions...
};

//(async  () => {
	//await getSteamStats(true);
	//await google.writeToSheets();
//})();

/*
//Return Wishlist stats from steam as csv
app.get('/get', async (req, res) => {
	//const name = process.env.NAME || 'World';
	let stats = await getSteamStats(true, false);
	console.log(stats);
	res.send(stats);
});

//Send data to spreadsheet listed in .env
app.get('/send', async (req, res) => {
	//const name = process.env.NAME || 'World';
	let stats = await getSteamStats(true, true);
	console.log(stats);
	res.send("Stats sent to spreadsheet.");
});
*/