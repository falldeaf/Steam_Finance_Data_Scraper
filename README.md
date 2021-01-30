# Steam Financial Data Scraper.

Steam does not provide an API for developers to download your marketing and financial data for your game. (Which includes your wishlist numbers). This script is designed to run as a Google Cloud Function to provide an endpoint for your data. It uses puppeteer to scrape [http://partner.steamgames.com/](http://partner.steamgames.com/ "http://partner.steamgames.com/"), and Testmail.app to get around the mandatory SteamGuard step.

## Quickstart:
1. Create a Testemail.app user account (The free tier works fine)
2. Create a new Steam user account using the email created from your testemail.app account
3. Grant it read-only access to *only* read your finance data.
4. Create a new Google cloud function
5. Add the following environment variables
	steamuser : [steam username]
	steampass : [steam password]
	  emailapi : [testmail.app api key]
	  emailnamespace : [your testmail.app namespace]
6. Replace packages.json and index.js with the code here.

The Google Cloud Function will return a CSV list of all your Steam financical data for the day. This could easily be added to a google spreadsheet now, for example.
