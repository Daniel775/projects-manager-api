import 'jsonwebtoken';

declare global {
	interface JwtPayload {
		id?: number;
	}
}
