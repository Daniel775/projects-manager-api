import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import router from './routes';

const server: Application = express();

server.use(express.json());
server.use(helmet());
server.use(cors());
server.use(router);

export default server;
