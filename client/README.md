# Risk Atlas client

React, TypeScript, Vite, Tailwind CSS, and Lucide UI prototype for the Kenya Re hackathon.

## Run locally

```bash
npm install
npm run dev
```

The app has three routes:

- `/` — dark Risk Atlas landing page with a scroll-scrubbed flood scene and Nairobi CAT model story.
- `/login` — Risk Atlas sign-in design and direct demo access.
- `/dashboard` — responsive Nairobi flood risk overview with illustrative portfolio data and three flood scenarios.

The login form currently opens the demo dashboard; account authentication is not connected. Dashboard values are sample data. The hero video uses the specified CloudFront URL first, with `/hero.mp4` as a local fallback. `/hero-poster.jpg` is a local first-frame poster.

For a production build, run `npm run build`.
