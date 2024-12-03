import { NextResponse } from "next/server";
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