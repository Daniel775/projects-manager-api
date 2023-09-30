import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const secret = process.env.SECRET!;

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
	const accessToken = req.headers.authorization;

	if (!accessToken) {
		return res.status(401).send({ error: 'No token provided' });
	}

	const parts = accessToken.split(' ');

	if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
		return res.status(401).send({ error: 'Invalid token' });
	}

	try {
		const decoded = jwt.verify(parts[1], secret) as JwtPayload;
		req.userId = decoded.id;
		next();
	} catch (error) {
		return res.status(401).send({ error: 'Invalid token' });
	}
}
