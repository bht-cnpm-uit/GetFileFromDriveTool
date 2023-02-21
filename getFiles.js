const fs = require('fs').promises;
const path = require('path');
const slug = require('vietnamese-slug');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// TODO: Change this to get files (after run: node search.js)
const ID_TO_GET_FILES = 'randomString';

// Limit of files in folder
const FILE_LIMIT = 100;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

async function listFiles(authClient, folderId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
        pageSize: FILE_LIMIT,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
        spaces: 'drive',
        q: `'${folderId}' in parents`,
    });
    const files = res.data.files;
    if (files.length === 0) {
        return null;
    }
    let filesAndChildren;
    filesAndChildren = files.map(async (file) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            let children = await listFiles(authClient, file.id);
            if (children) {
                return {
                    name: file.name,
                    type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : file.mimeType,
                    link: file.webViewLink,
                    path: slug(file.name),
                    children,
                };
            } else {
                return {
                    name: file.name,
                    type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : file.mimeType,
                    path: slug(file.name),
                    link: file.webViewLink,
                };
            }
        } else {
            return {
                name: file.name,
                type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : file.mimeType,
                path: slug(file.name),
                link: file.webViewLink,
            };
        }
    });
    return Promise.all(filesAndChildren);
}

async function run(authClient) {
    let files = await listFiles(authClient, ID_TO_GET_FILES);
    fs.writeFile('result.json', JSON.stringify(files), 'utf8');
}

authorize().then(run).catch(console.error);
