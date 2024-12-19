# Deploying AI Warden
The main instance of AI Warden ([ai-warden.ascpixi.dev](https://ai-warden.ascpixi.dev)) is hosted by Vercel, which can deploy the project automatically. Simply fork the repository, and select that fork as the repo for the project.

For other hosting services, you may use any Next.js template - or simply use `npm run start` in the repo's root.

## Environment variables
The app expects these variables to be defined:
- `HMAC_PRIVATE_KEY`: the private key for history verification,
- `TRUST_TOKEN_KEY`: the private key for generating trust JWTs (JSON Web Tokens),
- `HACKCLUB_OPENAI_TOKEN`: a token for the OpenAI backend - see the `#open-ai-token` channel on the Hack Club Slack for more information,
- `GOOGLE_AI_TOKEN`: a token for the Google AI backend, used for Gemini - you can create one for free on the Google AI Studio,
- `GROQ_API_KEY`: the API key for Groq, used for models other than GPT and Gemini,
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: the public site key for Cloudflare Turnstile,
- `NEXT_PRIVATE_TURNSTILE_SECRET_KEY`: the secret key for Cloudflare Turnstile.

Private keys can be generated via the `/util/generate-key.js` script:

```properties
$ node generate-key.js
d055f7ff9d01cf32af79b1fbbe0a919331787c7b1c80a600a6d76a525c8a1d649ce83d07118214de0734334d4ec64b8fd4218e7b9fb927406f33ac7729f79609
```

When setting up Cloudflare Turnstile, make sure the Widget Mode is set to **invisible**.
