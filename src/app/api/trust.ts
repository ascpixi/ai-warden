import jwt, { TrustTokenJwtPayload } from "jsonwebtoken";
import crypto from "crypto";

/**
 * The amount of seconds that a trust token may be alive for.
 */
export const TRUST_TOKEN_EXP = 10 * 60;

function hashData(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

declare module "jsonwebtoken" {
    export interface TrustTokenJwtPayload extends jwt.JwtPayload {
        exp: number;
        v: string;
    }
}

/**
 * Creates a JWT that proves that a client, identified by their IP address
 * and user agent, has passed anti-bot verification.
 */
export function createTrustToken(
    ip: string,
    userAgent: string
): string {
    const payload = {
        exp: Math.floor(Date.now() / 1000) + TRUST_TOKEN_EXP,
        v: hashData(ip + ";" + userAgent)
    } satisfies TrustTokenJwtPayload;

    return jwt.sign(payload, process.env.TRUST_TOKEN_KEY!);
}

/**
 * Verifies that a JWT provided by a client is valid, given their IP address and
 * user agent.
 */
export function verifyTrustToken(
    token: string,
    ip: string,
    userAgent: string
): boolean {
    try {
        const data = <TrustTokenJwtPayload>jwt.verify(token, process.env.TRUST_TOKEN_KEY!);
        if (data.v != hashData(ip + ";" + userAgent)) {
            return false;
        }

        return true;
    } catch (err) {
        console.warn("warn: JWT verification failed: ", err);
        return false;
    }
}
