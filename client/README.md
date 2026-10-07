# Risk Atlas client

The homepage is a standalone HTML page. The existing Risk Atlas login and dashboard remain React, TypeScript, Vite, and Tailwind pages.

## Run locally

```bash
npm install
npm run dev
```

The site has three page entries:

- `/` — self-contained Risk Atlas video hero in `index.html`. It can also be opened directly without a build step.
- `/login/` — Risk Atlas sign-in design and direct demo access.
- `/dashboard/` — responsive Nairobi flood risk overview using synthetic exposure data.

The homepage uses the CloudFront video and poster URLs specified in the design prompt. Its navigation and calls to action link to the Nairobi dashboard, its sections, and sign-in.

The login form currently opens the demo dashboard; account authentication is not connected. Dashboard values are illustrative.

For a production build, run `npm run build`.
