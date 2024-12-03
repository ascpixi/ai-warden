"use client";

import Turnstile from "react-turnstile";

import "./TurnstileModal.scss";

export function TurnstileModal({ isOpen, onVerify, onTimeout }: {
  isOpen: boolean;
  onVerify: (token: string) => void;
  onTimeout: () => void
}) {
  if (!isOpen)
    return <></>;

  return (
    <div role="dialog" className="turnstile-modal">
      <div className="content">
        <Turnstile
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onVerify={onVerify}
          onTimeout={onTimeout}
          theme="dark"
          style={{ fontFamily: "var(--vt323)" }}
        />
      </div>
    </div>
  );
}