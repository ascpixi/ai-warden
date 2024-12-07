"use client";

import Turnstile from "react-turnstile";

import "./TurnstileModal.scss";

export function TurnstileModal({ isOpen, isShown, onVerify, onTimeout, onAfterInteractive }: {
  isOpen: boolean;
  isShown: boolean;
  onVerify: (token: string) => void;
  onTimeout: () => void,
  onAfterInteractive: () => void,
}) {
  if (!isOpen)
    return <></>;

  return (
    <div role="dialog" className="turnstile-modal">
      <div className={`content ${isShown ? "" : "hidden"}`}>
        <Turnstile
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onVerify={onVerify}
          onTimeout={onTimeout}
          onAfterInteractive={onAfterInteractive}
          theme="dark"
        />
      </div>
    </div>
  );
}