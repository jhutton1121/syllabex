export interface JwtPayload {
    role: string;
    exp: number;
    iat: number;
}
