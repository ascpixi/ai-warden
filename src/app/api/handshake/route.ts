"use server";

import { InferType, object, string } from "yup";
import { apiError, FailedApiResponse, invalidParamsResponse, verifyWhois, whois } from "../common";
import { turnstileVerify } from "../turnstile";
import { NextRequest, NextResponse } from "next/server";
import { createTrustToken } from "../trust";

const apiHandshakeSchema = object({
    /** The Turnstile token to verify that this request is coming from an actual user. */
    tt: string().required().min(128).max(2048),
});

export type ApiHandshakeParams = InferType<typeof apiHandshakeSchema>;

export type ApiHandshakeReponse = {
    ok: true;
    token: string;
} | FailedApiResponse;

export async function POST(request: NextRequest): Promise<NextResponse<ApiHandshakeReponse>> {
    let params: ApiHandshakeParams;
    try {
        params = await apiHandshakeSchema.validate(await request.json());
    } catch (err) {
        return invalidParamsResponse(err);
    }

    if (!await turnstileVerify(request, params.tt))
        return apiError("Turnstile verification failed");

    const { ip, ua } = whois(request);

    const whoisError = verifyWhois(request, ip, ua);
    if (whoisError != null)
        return whoisError;

    return NextResponse.json({
        ok: true,
        token: createTrustToken(ip!, ua!)
    });
}