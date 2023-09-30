import dotenv from 'dotenv';
import server from './app';

dotenv.config();

server.listen(process.env.PORT, () =>
	console.log(`Listening port ${process.env.PORT}`)
);
