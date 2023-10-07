import { OAuth2Client } from 'google-auth-library';

const oAuth2Client = new OAuth2Client(
	process.env.OAUTH_CLIENT_ID,
	process.env.OAUTH_CLIENT_SECRET,
	'postmessage'
);

export default oAuth2Client;
