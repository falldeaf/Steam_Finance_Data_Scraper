const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/*
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
if (err) return console.log('Error loading client secret file:', err);
// Authorize a client with credentials, then call the Gmail API.
authorize(JSON.parse(content), getLastSteamGuard);
});
*/

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback) {
	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
	client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	let token = await new Promise(function(resolve) {
		fs.readFile(TOKEN_PATH, (err, token) => {
			if (err) return getNewToken(oAuth2Client, callback);
			resolve(token);
		});
	});

	oAuth2Client.setCredentials(JSON.parse(token));
	return callback(oAuth2Client);

	/*
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});*/
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
const authUrl = oAuth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: SCOPES,
});
console.log('Authorize this app by visiting this url:', authUrl);
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.question('Enter the code from that page here: ', (code) => {
	rl.close();
	oAuth2Client.getToken(code, (err, token) => {
	if (err) return console.error('Error retrieving access token', err);
	oAuth2Client.setCredentials(token);
	// Store the token to disk for later program executions
	fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
		if (err) return console.error(err);
		console.log('Token stored to', TOKEN_PATH);
	});
	callback(oAuth2Client);
	});
});
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
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

async function writeSheetsRow(auth, values) {
	const sheets = google.sheets({version: 'v4', auth});
	const request = {
		spreadsheetId: process.env.spreadsheetid,
		range: process.env.spreadsheetq,  // TODO: Update placeholder value.
		valueInputOption: 'RAW',  // TODO: Update placeholder value.
		insertDataOption: 'INSERT_ROWS',  // TODO: Update placeholder value.
		resource: {
			values: [values]
		},
		auth: auth,
	  };
	
	  try {
		const response = (await sheets.spreadsheets.values.append(request)).data;
		//console.log(JSON.stringify(response, null, 2));
		console.log("Row added to:"+process.env.spreadsheetid);
	  } catch (err) {
		console.error(err);
	  }
}

exports.getSteamCode = async () => {
	// Load client secrets from a local file.
	let steamguardkey = await new Promise(function(resolve) {
		fs.readFile('credentials.json', async (err, content) => {
			if (err) return console.log('Error loading client secret file:', err);
			// Authorize a client with credentials, then call the Gmail API.
			resolve(authorize(JSON.parse(content), getLastSteamGuard));
		});
	});
	//console.log("Inside getsteamcode:" + steamguardkey);
	return steamguardkey;
};

exports.writeToSheets = async (values) => {
	fs.readFile('credentials.json', async (err, content) => {
		if (err) return console.log('Error loading client secret file:', err);
		// Authorize a client with credentials, then call the Gmail API.
		authorize(JSON.parse(content), async(auth) => {
			writeSheetsRow(auth, values);
		});
	});
}