export interface SignupRequestData {
	name: string;
	email: string;
	imageUrl: string;
	googleId: string;
	googleToken: string;
}

export interface LoginRequestData {
	googleId: string;
	googleToken: string;
}
