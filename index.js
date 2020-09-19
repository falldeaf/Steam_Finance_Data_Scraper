require('dotenv').config();
const puppeteer = require('puppeteer');

//process.env.steamuser
//process.env.steampass

async function getSteamStats() {
	const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: false});
	const page = await browser.newPage();
	await page.goto("https://partner.steampowered.com/");

	await page.type('#username', process.env.steamuser);
	await page.type('#password', process.env.steampass);
	await page.click('#login_btn_signin');
	await page.waitForNavigation({ waitUntil: 'networkidle0' });


	await page.goto("https://partner.steampowered.com/app/details/1411810/?dateStart=2000-01-01&dateEnd=2020-09-18");
	return;

	let urls = await page.evaluate(() => {
		let results = [];
		let items = document.querySelectorAll('a.storylink');
		items.forEach((item) => {
			results.push({
				url:  item.getAttribute('href'),
				text: item.innerText,
			});
		});
		return results;
	});
	console.log(urls);
}

getSteamStats();
