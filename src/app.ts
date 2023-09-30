import express, { Application } from 'express';
import helmet from 'helmet';
import router from './routes';

const server: Application = express();

server.use(express.json());
server.use(helmet());
server.use(router);

export default server;
