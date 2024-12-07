"use client";

import { useEffect, useState } from "react";
import { sleep } from "./util";

export function WithFilters({ children }: { children: React.ReactNode }) {
  const [shouldShift, setShouldShift] = useState(true);

  useEffect(() => {
    if (navigator.userAgent.includes("Firefox")) {
      alert("It looks like you're using Firefox - please be advised that SVG filters are not hardware-accelerated on Firefox and cause performance issues. If you're having lag, please switch to a browser like Chrome.");
    }

    (async () => {
      await sleep(150);
      setShouldShift(false);
      await sleep(100);
      setShouldShift(true);
      await sleep(100);
      setShouldShift(false);
    })();
  }, []);

  return <div style={{
    width: shouldShift ? "99.99%" : "100%",
    height: "100%",
  }}>
    <CssFilters />
    {children}
  </div>
}

export const CssFilters = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={0} height={0} style={{
    position: "absolute",
    opacity: 0
  }}>
    <filter id="rawBloom">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="exposure" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="64" result="spread" />
      <feBlend in="spread" in2="exposure" result="bloom" mode="lighten" />

      <feComponentTransfer in="bloom" result="final">
        <feFuncA id="bloomIntensity" type="linear" slope="0.75" />
      </feComponentTransfer>

      <feBlend in="SourceGraphic" in2="final" mode="screen" />
    </filter>

    <filter id="bloom">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="exposure" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="64" result="spread" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="256" result="largeSpread" />

      <feBlend in="spread" in2="exposure" result="rawBloom" mode="lighten" />
      <feBlend in="rawBloom" in2="largeSpread" result="rawBloom" mode="luminosity" />

      <feComponentTransfer in="SourceGraphic" result="halfSource">
        <feFuncR type="linear" slope="0.25" />
        <feFuncG type="linear" slope="0.25" />
        <feFuncB type="linear" slope="0.25" />
        <feFuncA type="linear" slope="0.25" />
      </feComponentTransfer>

      <feBlend in="rawBloom" in2="halfSource" result="bloom" mode="multiply" />

      <feComponentTransfer in="bloom" result="final">
        <feFuncA id="bloomIntensity" type="linear" slope="0.75" />
      </feComponentTransfer>

      <feBlend in="SourceGraphic" in2="final" mode="screen" />
    </filter>

    <filter id="crt">
      <feImage xlinkHref="/img/rgb_pattern.png" width="6" height="4" result="rgbPattern" />
      {/* <feImage xlinkHref="/img/crt_displacement.png" result="crtDisplacement" /> */}

      <feTile in="rgbPattern" result="crtMatrix" />
      <feComposite in="crtMatrix" in2="SourceAlpha" operator="in" result="crtMatrix" />

      <feComponentTransfer in="crtMatrix" result="crtMatrix">
        <feFuncA type="gamma" amplitude="2" exponent="2" offset="0"></feFuncA>
      </feComponentTransfer>

      <feBlend in="SourceGraphic" in2="crtMatrix" mode="screen" />
    </filter>
  </svg>
);