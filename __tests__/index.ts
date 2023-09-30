import supertest from 'supertest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { Prisma } from '@prisma/client';
import {
	LoginTicket,
	OAuth2Client,
	VerifyIdTokenOptions
} from 'google-auth-library';
import server from '../src/app';
import prisma from '../src/services/prisma';
import oauth from '../src/services/oauth';
import { LoginRequestData, SignupRequestData } from '../src/types';

interface MockOAuth2Client extends OAuth2Client {
	verifyIdToken: (options: VerifyIdTokenOptions) => Promise<LoginTicket>;
}

const user = {
	id: 1,
	name: 'name',
	email: 'email@email.com',
	imageUrl: 'https://image.com',
	googleId: '1'
};

const loginTicket = {
	getPayload: () => ({ sub: user.googleId })
} as LoginTicket;

jest.mock('../src/services/oauth', () => ({
	__esModule: true,
	default: mockDeep<MockOAuth2Client>()
}));

const oauthMock = oauth as unknown as DeepMockProxy<MockOAuth2Client>;

jest.mock('../src/services/prisma', () => ({
	__esModule: true,
	default: mockDeep<PrismaClient>()
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
	mockReset(oauthMock);
	mockReset(prismaMock);
});

describe('POST /signup', () => {
	it('should return a user data', async () => {
		prismaMock.user.create.mockResolvedValue({
			...user,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		oauthMock.verifyIdToken.mockResolvedValue(loginTicket);

		const response = await supertest(server)
			.post('/signup')
			.send({
				email: 'email@email.com',
				name: 'name',
				googleId: '1',
				googleToken: 'token',
				imageUrl: 'https://image.com'
			} as SignupRequestData);

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			token: expect.any(String),
			user
		});
	});

	it('should fail if the data is not passed', async () => {
		const response = await supertest(server).post('/signup');

		expect(response.statusCode).toBe(422);
		expect(response.body).toEqual({
			error: [
				'name is a required field',
				'email is a required field',
				'imageUrl is a required field',
				'googleId is a required field',
				'googleToken is a required field'
			]
		});
	});

	it('should fail if the user already exists', async () => {
		prismaMock.user.create.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError('', {
				code: 'P2002',
				clientVersion: 'mock'
			})
		);

		oauthMock.verifyIdToken.mockResolvedValue(loginTicket);

		const response = await supertest(server)
			.post('/signup')
			.send({
				email: 'email@email.com',
				name: 'name',
				googleId: '1',
				googleToken: 'token',
				imageUrl: 'https://image.com'
			} as SignupRequestData);

		expect(response.statusCode).toBe(409);
		expect(response.body).toEqual({
			error: 'account already exist'
		});
	});

	it('should fail if the google token is rejected', async () => {
		prismaMock.user.create.mockResolvedValue({
			...user,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		oauthMock.verifyIdToken.mockRejectedValue(new Error());

		const response = await supertest(server)
			.post('/signup')
			.send({
				email: 'email@email.com',
				name: 'name',
				googleId: '1',
				googleToken: 'token',
				imageUrl: 'https://image.com'
			} as SignupRequestData);

		expect(response.statusCode).toBe(301);
		expect(response.body).toEqual({ error: 'invalid token' });
	});
});

describe('POST /login', () => {
	it('should return the login data', async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			...user,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		oauthMock.verifyIdToken.mockResolvedValue(loginTicket);

		const response = await supertest(server)
			.post('/login')
			.send({
				googleToken: 'token',
				googleId: '1'
			} as LoginRequestData);

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			token: expect.any(String),
			user
		});
	});

	it('should fail if the data is not passed', async () => {
		const response = await supertest(server).post('/login');

		expect(response.statusCode).toBe(422);
		expect(response.body).toEqual({
			error: [
				'googleId is a required field',
				'googleToken is a required field'
			]
		});
	});

	it('should fail if the user does not exist', async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);

		const response = await supertest(server)
			.post('/login')
			.send({
				googleToken: 'token',
				googleId: '1'
			} as LoginRequestData);

		expect(response.statusCode).toBe(301);
		expect(response.body).toEqual({
			error: 'user not found'
		});
	});

	it('should fail if the google token is rejected', async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			...user,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		oauthMock.verifyIdToken.mockRejectedValue(new Error());

		const response = await supertest(server)
			.post('/login')
			.send({
				googleToken: 'token',
				googleId: '1'
			} as SignupRequestData);

		expect(response.statusCode).toBe(301);
		expect(response.body).toEqual({ error: 'invalid token' });
	});
});
