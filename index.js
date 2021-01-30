require('dotenv').config();
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')

async function getSteamStatsWeb(head) {
	//Login to Steam
	const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: head});
	const page = await browser.newPage();
	await page.goto("https://partner.steampowered.com/");

	//Enter credentials
	await page.type('#username', process.env.steamuser);
	await page.type('#password', process.env.steampass);
	await page.click('#login_btn_signin');
	await page.waitForSelector('.loginAuthCodeModal', {visible: true});

	//Wait for Steamguard email
	const steamcode = await getSteamGuardCode(false);

	//Enter steamcode
	await page.type('#authcode', steamcode);
	await page.click('#auth_buttonset_entercode > div.auth_button.leftbtn');
	
	//Wait until success button appears then press
	await page.waitForSelector('#success_continue_btn', {visible: true});
	await page.click('#success_continue_btn');

	//Wait for the main page to load, then goto stats page
	await page.waitForSelector('.hr-color');
	var today = new Date().toISOString().substring(0, 10);
	await page.goto("https://partner.steampowered.com/app/details/1411810/?dateStart=2000-01-01&dateEnd=" + today);

	//Grab values from table
	const $ = cheerio.load(await page.evaluate(() => document.querySelector('*').outerHTML));
	
	let stats = [];
	stats.push(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
	$('#gameDataLeft div:first-child td:nth-child(2)').each(function(i, elem) {
		var val = $(this).text().replace(/\$|\s/gm,'');
		//console.log(i + " : " + val);
		stats.push(val);
	});

	console.log("Success:"+stats.join(','));
	await browser.close();
	return stats.join(',');
}

async function getSteamGuardCode(debug){
	var timestamp = debug ? 1611987569691 : new Date().valueOf();
	var emailurl = "https://api.testmail.app/api/json?apikey=" + process.env.emailapi + "&namespace=" + process.env.emailnamespace + "&pretty=true&&livequery=true&&limit=1&tag=steam&timestamp_from=" + timestamp;

	//get the email JSON data, then find the body text of the email
	var emailjson = await fetch(emailurl);
	const data = await emailjson.json();
	var emailtext = await data.emails[0].text;

	//Find the steam code, should be 5 capital Alpha or Numeric characters, surrounded by 3 or more spaces
	const regex = /\s{2,}[A-Z0-9]{5}\s{2,}/gm;
	let steamcode = regex.exec(emailtext)[0].replace(/\s/g,'');

	return steamcode;
}

exports.getSteamStats = async (req, res) => {
	//Set to true for remote (run puppateer headless mode)
	res.send(await getSteamStatsWeb(true));
};