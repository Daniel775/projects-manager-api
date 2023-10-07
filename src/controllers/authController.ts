import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import * as yup from 'yup';
import prisma from '../services/prisma';
import client from '../services/oauth';
import { LoginRequestData, SignupRequestData } from '../types';
import { TokenPayload } from 'google-auth-library';

const loginSchema = yup.object().shape({
	googleId: yup.string().required(),
	googleToken: yup.string().required()
});

const signupSchema = yup.object().shape({
	googleAccessToken: yup.string().required()
});

export async function login(
	req: Request<object, object, LoginRequestData>,
	res: Response
) {
	try {
		await loginSchema.validate(req.body, { abortEarly: false });
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			return res.status(422).json({ error: error.errors });
		}
	}

	const { googleId, googleToken } = req.body;

	const user = await prisma.user.findUnique({
		where: { googleId },
		select: { id: true, name: true, email: true, imageUrl: true }
	});

	if (!user) {
		return res.status(301).send({ error: 'user not found' });
	}

	const isValid = await verifyGoogleToken(googleToken, googleId);

	if (!isValid) {
		return res.status(301).send({ error: 'invalid token' });
	}

	const token = jwt.sign({ id: user!.id }, process.env.SECRET as string, {
		expiresIn: '1h'
	});

	return res.json({ token, user });
}

export async function signup(
	req: Request<object, object, SignupRequestData>,
	res: Response
) {
	try {
		await signupSchema.validate(req.body, { abortEarly: false });
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			return res.status(422).json({ error: error.errors });
		}
	}

	const { googleAccessToken } = req.body;

	const userData = await getGoogleToken(googleAccessToken);

	if (!userData) {
		return res.status(301).send({ error: 'invalid token' });
	}

	try {
		const user = await prisma.user.create({
			data: {
				name: userData.name as string,
				email: userData.email as string,
				imageUrl: userData.picture as string,
				googleId: userData.sub
			},
			select: { id: true, name: true, email: true, imageUrl: true }
		});

		const token = jwt.sign({ id: user!.id }, process.env.SECRET as string, {
			expiresIn: '1h'
		});
		return res.json({ token, user });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code == 'P2002') {
				return res.status(409).json({
					error: 'account already exist'
				});
			}
		}

		return res.status(500).send();
	}
}

async function getGoogleToken(code: string): Promise<TokenPayload | null> {
	try {
		const { tokens } = await client.getToken(code);

		const ticket = await client.verifyIdToken({
			idToken: tokens.id_token!
		});

		return ticket.getPayload() as TokenPayload;
	} catch (error) {
		return null;
	}
}

async function verifyGoogleToken(
	token: string,
	googleId: string
): Promise<boolean> {
	try {
		const ticket = await client.verifyIdToken({
			idToken: token
		});

		const payload = ticket.getPayload();
		const userId = payload!.sub;

		return userId == googleId;
	} catch (error) {
		return false;
	}
}
