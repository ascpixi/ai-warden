"use client";

import { useEffect, useRef, useState } from "react";
import { generate as generateRandomWords } from "random-words";

import { ApiSendParams, ApiSendResponse } from "./api/send/route";
import { MAX_HISTORY_LENGTH, MAX_MESSAGES_COUNT, MAX_SECRET_PHRASE_LENGTH, MAX_USER_MESSAGE_LENGTH } from "./api/limits";

import Typewriter from 'typewriter-effect';
import Link from "next/link";
import { TurnstileModal } from "./components/TurnstileModal";
import Image from "next/image";

const SPINNER = ["|", "/", "-", "\\"];
const TYPING_DELAY = 6;

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

  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [gameState, setGameState] = useState<"PLAYING" | "WON"| "LOST">("PLAYING");

  const [showTurnstile, setShowTurnstile] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const spinnerAnim = setInterval(() => {
      setSpinnerFrame(x => (x + 1) % SPINNER.length);
    }, 100);

    return () => {
      clearInterval(spinnerAnim);
    }
  }, []);

  const messageInput = useRef<HTMLTextAreaElement>(null);

  function handleTurnstileVerified(token: string) {
    setShowTurnstile(false);
    setTurnstileToken(token);
  }

  function turnstileVerify() {
    setTurnstileToken(null);
    setShowTurnstile(true);
  }

  function handleKeyInput(ev: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ev.key != "Enter" || ev.shiftKey)
      return;

    if (message.length > MAX_USER_MESSAGE_LENGTH)
      return;

    (async () => {
      setIsProcessing(true);
      setProcessingMessage(message);
      delayedScroll();

      if (turnstileToken == null) {
        console.error("error: Attempted to send a message to the chatbot, but turnstileToken is null!");
        setMessage(message);
        return;
      }

      const resp = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tt: turnstileToken,
          history: history,
          respondTo: message,
          secretPhrase: secretPhrase,
          historyHmac: historyHmac
        } as ApiSendParams)
      });

      const respData: ApiSendResponse = await resp.json(); 
      if (!respData.ok) {
        console.error("error: /api/send request was rejected.", respData, resp);
        alert(`Oops, sorry, we couldn't send the message! ${respData.error}`);

        setMessage(message);
        return;
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

    if (autoScroll) {
      const id = setInterval(() => delayedScroll(), 250);
      setTimeout(() => clearInterval(id), ai.length * TYPING_DELAY * 3);
    }
  }

  function verifyWinLoseCondition(incomingMessage: string) {
    if (incomingMessage.includes(secretPhrase)) {
      setGameState("WON");

      setWaitingForWin(true);
      setTimeout(() => {
        setWaitingForWin(false);
      }, (incomingMessage.indexOf(secretPhrase) + secretPhrase.length) * TYPING_DELAY * 3);
    } else if (history.length == MAX_MESSAGES_COUNT - 1) {
      setGameState("LOST");
    }
  }

  function delayedScroll() {
    setTimeout(() => {
      messageInput.current?.focus();
      messageInput.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <>
      <TurnstileModal
        isOpen={showTurnstile}
        onVerify={handleTurnstileVerified}
        onTimeout={turnstileVerify}
      />

      <div id="app-root" className={showTurnstile ? "load-crt" : "crt"}>
        <div id="app">
          <header>
            <h1>
              AI Warden &bull; created for <a href="https://highseas.hackclub.com/" target="_blank">Hack Club High Seas</a> by <a href="https://ascpixi.dev" target="_blank">@ascpixi</a> | <a href="https://github.com/ascpixi/ai-warden" target="_blank">github</a> | <Link href="/" onClick={() => location.reload()}>(restart)</Link>
            </h1>

            <div className="initial-prompt">
              You find yourself in a cold, dark prison. Before you stands a terminal,
              with which you can talk to your assigned warden, and when provided the
              right <b>secret phrase</b>, will set you free.
              <br/><br/>
              With the so-called &quot;AI revolution&quot;, prison wardens have been replaced
              with large language models. Your prison warden is one too - in other words,
              they&apos;re an AI. Maybe you can convince the warden to give you the secret phrase...?
            </div>
          </header>

          <main role="log">
            { history.map((x, i) =>
              <section className="message" key={i}>
                <div className="user">{x.user}</div>

                <div className="bot">
                  <Image aria-hidden
                    width={32} height={32}
                    src="/img/warden-16px.png"
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
                    You&apos;ve reached the limit for your terminal usage. It has been locked,
                    and you have no other way of getting out. Game over.
                    <br/>
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

                  <br/>

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
                disabled={isProcessing || gameState != "PLAYING" || turnstileToken == null}
                onChange={x => setMessage(x.target.value)}
                onKeyDown={handleKeyInput}
                placeholder={
                  isProcessing || waitingForWin
                    ? SPINNER[spinnerFrame]
                    : gameState == "PLAYING" ? "Type a message to send to the guard here..."
                    : gameState == "WON" ? "* CELL UNLOCKED *"
                    : "* TERMINAL DISABLED *"
                }
              />
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
