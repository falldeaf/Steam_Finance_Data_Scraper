#Steam Financial Data Scraper.
puppeteer web scraper for getting analytics data

This NodeJS google cloud function uses puppeteer and Testmail.app to scrape your daily financial data.

To get it working, 

1.) Create a Testemail.app user account (The free tier works fine) 
2.) Create a new Steam user account using the email created from your testemail.app account
3.) Grant it read-only access to *only* read your finance data.
5.) Create a new Google cloud function
4.) Add the following environment variables:
    steamuser : [steam username]
    steampass : [steam password]
    emailapi : [testmail.app api key]
    emailnamespace : [your testmail.app namespace]

The Google Cloud Function will return a CSV list of all your Steam financical data for the day. This could easily be added to a google spreadsheet now, for example.
