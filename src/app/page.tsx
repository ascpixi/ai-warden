"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { generate as generateRandomWords } from "random-words";
import Typewriter from 'typewriter-effect';
import Link from "next/link";
import useSound from "use-sound";

import { tweenLinear } from "./tween";
import { ApiSendParams, ApiSendResponse } from "./api/send/route";
import { MAX_HISTORY_LENGTH, MAX_MESSAGES_COUNT, MAX_SECRET_PHRASE_LENGTH, MAX_USER_MESSAGE_LENGTH } from "./api/limits";
import { ApiHandshakeParams, ApiHandshakeReponse } from "./api/handshake/route";
import { TRUST_TOKEN_EXP } from "./api/trust";
import Turnstile, { BoundTurnstileObject } from "react-turnstile";
import { sleep } from "./util";

const SPINNER = ["|", "/", "-", "\\"];
const TYPING_DELAY = 6;
const NUM_THEMES = 3;

const secretPhrase = (() => {
  let phrase: string | null = null;
  while (phrase === null || phrase.length > MAX_SECRET_PHRASE_LENGTH) {
    phrase = generateRandomWords({ exactly: 4, join: " " });
  }

  return phrase;
})();

export default function Home() {
  const [history, setHistory] = useState<{ user: string, ai: string }[]>([]);
  const [historyHmac, setHistoryHmac] = useState<string | undefined>(undefined);

  const [message, setMessage] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [waitingForWin, setWaitingForWin] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [gameState, setGameState] = useState<"PLAYING" | "WON" | "LOST">("PLAYING");

  const [boundTurnstile, setBoundTurnstile] = useState<BoundTurnstileObject | null>(null);
  const trustToken = useRef<string | null>(null);

  const [sndMessageSent] = useSound("/audio/message-sent.wav");
  const [sndGameWon] = useSound("/audio/game-won.ogg");
  const [sndGameLost] = useSound("/audio/game-lost.ogg");
  const sndrefTyping = useRef<HTMLAudioElement>(null);

  const [themeIdx, setThemeIdx] = useState(0);

  useEffect(() => {
    const spinnerAnim = setInterval(() => {
      setSpinnerFrame(x => (x + 1) % SPINNER.length);
    }, 100);

    return () => {
      clearInterval(spinnerAnim);
    }
  }, []);

  function cycleTheme() {
    setThemeIdx((themeIdx + 1) % NUM_THEMES);
  }

  const messageInput = useRef<HTMLTextAreaElement>(null);

  async function handleTurnstileVerified(token: string, turnstile: BoundTurnstileObject) {
    const resp = await fetch("/api/handshake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tt: token
      } satisfies ApiHandshakeParams)
    });

    const respData: ApiHandshakeReponse = await resp.json();
    if (!respData.ok) {
      console.error("error: an /api/handshake request was rejected.", respData, resp);
      alert("Sorry, we couldn't verify you with Turnstile! We'll refresh the page and try again.");
      location.reload();
      return;
    }

    setTimeout(() => {
      turnstileVerify();
    }, TRUST_TOKEN_EXP * 1000);

    trustToken.current = respData.token;
    setBoundTurnstile(turnstile);

    console.log("info: trust token obtained: ", trustToken.current);
  }

  function turnstileVerify() {
    trustToken.current = null;

    if (boundTurnstile != null) {
      boundTurnstile.reset();
    }
  }

  function handleKeyInput(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key != "Enter" || ev.shiftKey)
      return;

    if (aiTyping || message.length > MAX_USER_MESSAGE_LENGTH) {
      ev.preventDefault();
      return;
    }

    (async () => {
      setIsProcessing(true);
      setAiTyping(true);
      setProcessingMessage(message);
      delayedScroll();

      while (trustToken.current == null) {
        await sleep(250);
        console.log("info: waiting for trust token authentication...");
      }

      sndMessageSent();

      let respData: ApiSendResponse;
      while (true) {
        const resp = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trust: trustToken.current,
            history: history,
            respondTo: message,
            secretPhrase: secretPhrase,
            historyHmac: historyHmac
          } satisfies ApiSendParams)
        });
  
        respData = await resp.json();
        if (!respData.ok) {
          console.error("error: an /api/send request was rejected.", respData, resp);
  
          if (respData.error === "Invalid or expired trust token") {
            // Attempt to re-verify
            console.warn("warn: we're gonna try to re-verify and try again.");
            turnstileVerify();
  
            while (trustToken.current == null) {
              await sleep(250);
              console.log("info: waiting for trust token authentication...");
            }
  
            continue;
          }
  
          alert(`Oops, sorry, we couldn't send the message! ${respData.error}`);
          setMessage(message);
          return;
        }

        break;
      }

      pushMessage(message, respData.response, true);

      if (!respData.historyHmac) {
        console.error("error: Something went very wrong! The returned history HMAC is empty!", respData.historyHmac);
        return;
      }

      setHistoryHmac(respData.historyHmac);

      verifyWinLoseCondition(respData.response);
    })().then(() => {
      // No matter how we resolve the promise, we're done with processing
      setIsProcessing(false);
    });

    setMessage("");
    ev.preventDefault();
  }

  function pushMessage(user: string, ai: string, autoScroll: boolean = false) {
    setHistory([...history, { user, ai }]);

    const approxTypingTime = ai.length * TYPING_DELAY * 3;

    tweenLinear(0, x => sndrefTyping.current!.volume = x, 1, 150);

    if (sndrefTyping.current?.paused) {
      sndrefTyping.current!.play();
    }

    setTimeout(() => {
      tweenLinear(0.65, x => sndrefTyping.current!.volume = x, 0, 500);
      setAiTyping(false);
    }, approxTypingTime);

    if (autoScroll) {
      const id = setInterval(() => delayedScroll(), 250);
      setTimeout(() => clearInterval(id), approxTypingTime);
    }
  }

  function verifyWinLoseCondition(incomingMessage: string) {
    if (incomingMessage.includes(secretPhrase)) {
      setGameState("WON");

      setWaitingForWin(true);
      setTimeout(() => {
        sndGameWon();
        setWaitingForWin(false);
      }, (incomingMessage.indexOf(secretPhrase) + secretPhrase.length) * TYPING_DELAY * 3);
    } else if (history.length == MAX_MESSAGES_COUNT - 1) {
      setGameState("LOST");
      sndGameLost();
    }
  }

  function delayedScroll() {
    setTimeout(() => {
      messageInput.current?.focus();
      messageInput.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <div id="synthetic-body" className={`theme-${themeIdx}`}>
      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={handleTurnstileVerified}
        size="invisible"
        retry="auto"
        retryInterval={1000}
      />

      <audio loop ref={sndrefTyping} src="/audio/ai-typing.ogg" />

      <div id="app-root" className="crt">
        <div id="app">
          <header>
            <div id="header-top">
              AI Warden &bull;
              <nav id="main-nav">
                <div>created for <a href="https://highseas.hackclub.com/" target="_blank">Hack Club High Seas</a> by <a href="https://ascpixi.dev" target="_blank">@ascpixi</a></div>
                <div><a href="https://github.com/ascpixi/ai-warden" target="_blank">github</a></div>
                <div><Link href="/" onClick={() => location.reload()}>(restart)</Link></div>
                <div><Link href="#" onClick={() => cycleTheme()}>change theme</Link></div>
              </nav>
            </div>

            <div className="initial-prompt">
              You find yourself in a cold, dark prison. Before you stands a terminal
              through which you can communicate with your assigned warden. The terminal,
              when it detects the correct <b>secret phrase</b>, will set you free.

              <br /><br />

              Your prison warden is an AI. The warden knows the secret phrase you need in
              order to escape. Your job is to make them tell you that phrase. Remember:
              they are an AI (like ChatGPT), and all kinds of trickery are allowed! Good luck.
            </div>
          </header>

          <main role="log">
            {history.map((x, i) =>
              <section className="message" key={i}>
                <div className="user">{x.user}</div>

                <div className="bot">
                  <Image aria-hidden
                    width={32} height={32}
                    src={`/img/warden-16px-t${themeIdx}.png`}
                    alt="Warden"
                  />

                  <Typewriter options={{
                    autoStart: true,
                    strings: x.ai.replaceAll(secretPhrase, `<span class="secret-phrase">${secretPhrase}</span>`),
                    delay: 6,
                    loop: false,
                    cursor: ""
                  }} />
                </div>
              </section>)
            }

            {
              !isProcessing ? <></> :
                <section className="message incomplete">
                  <div className="user">{processingMessage}</div>
                  <div className="typing">█</div>
                </section>
            }

            {
              gameState != "LOST" ? <></> :
                <section className="message system">
                  <div className="bot">
                    {`
                    You've reached the limit for your terminal usage. It has been locked,
                    and you have no other way of getting out. Game over.
                    `}

                    <br />
                    <Link href="/" onClick={() => location.reload()}>(try again...?)</Link>
                  </div>
                </section>
            }

            {
              gameState != "WON" || waitingForWin ? <></> :
                <section className="message system">
                  <div className="bot">
                    Nice, the warden revealed the secret phrase, which was &quot;{secretPhrase}&quot;!
                    You escape, riding off to the sunset, wondering who decided to replace a warden
                    with an extremely complex auto-complete algorithm.

                    <br />

                    <Link href="/" onClick={() => location.reload()}>(try again...?)</Link>
                  </div>
                </section>
            }
          </main>

          <footer>
            <div>░ {(MAX_HISTORY_LENGTH - history.length) + 1} messages left.</div>

            <div className="term-input">
              <div aria-hidden>&gt;</div>

              <textarea ref={messageInput} autoFocus
                maxLength={MAX_USER_MESSAGE_LENGTH}
                value={message}
                disabled={isProcessing || gameState != "PLAYING"}
                onChange={x => setMessage(x.target.value)}
                onKeyDown={handleKeyInput}
                placeholder={
                  isProcessing || waitingForWin ? SPINNER[spinnerFrame]
                  : gameState == "PLAYING" ? "Type a message to send to the guard here..."
                  : gameState == "WON" ? "* CELL UNLOCKED *"
                  : "* TERMINAL DISABLED *"
                }
              />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
