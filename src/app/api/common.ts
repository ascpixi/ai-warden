import { NextRequest, NextResponse, userAgent } from "next/server";
import { ValidationError } from "yup";

export interface FailedApiResponse {
    ok: false;
    error: string;
};

export function apiError(message: string): NextResponse<FailedApiResponse> {
    return NextResponse.json(
        { ok: false, error: message },
        { status: 400 }
    );
}

export function apiServerError(): NextResponse<FailedApiResponse> {
    return NextResponse.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
    );
}

export function invalidParamsResponse(err: unknown): NextResponse<FailedApiResponse> {
    if (err instanceof ValidationError) {
        return NextResponse.json({
            ok: false,
            error: `Invalid request body: ${err.message}`
        }, { status: 400 });
    }

    console.error(err);
    return apiServerError();
}

/**
 * Returns IP and user agent of the originator of an incoming HTTP request.
 */
export function whois(request: NextRequest) {
    let ip = request.headers.get("x-real-ip");
    if (ip == null) {
        if (process.env.NODE_ENV === "production") {
            ip = null;
        } else {
            ip = "127.0.0.1";
        }
    }

    const ua = request.headers.get("user-agent");

    return { ip, ua };
}

export function verifyWhois(
    request: NextRequest,
    ip: string | null,
    ua: string | null
) {
    if (ip == null)
        return apiError("Could not determine your IP address");

    if (ua === null)
        return apiError("Could not determine your user agent");

    if (userAgent(request).isBot)
        return apiError("Automated software is not allowed to use this endpoint");

    return null;
}