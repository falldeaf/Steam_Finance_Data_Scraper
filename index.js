require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const express = require('express');

const google = require('./google');
const app = express();

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

	let steamcode = await google.getSteamCode();
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

//(async  () => {
	//await getSteamStats(true);
	//await google.writeToSheets();
//})();

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

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Ready.  Get-> http://127.0.0.1:${port}/get Send-> http://127.0.0.1:${port}/send`);
});
