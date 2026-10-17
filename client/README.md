# Risk Atlas client

The homepage is a standalone HTML page. Login, dashboard, and the model workspace use React, TypeScript, Vite, and Tailwind.

## Run locally

```bash
npm install
npm run dev
```

The site has four page entries:

- `/` — self-contained Risk Atlas video hero in `index.html`. It can also be opened directly without a build step.
- `/login/` — Risk Atlas sign-in design and direct demo access.
- `/dashboard/` — underwriting summary at `#overview`. A reviewed property calculation shows that property's losses, terms, location and checks. A portfolio run with added free-text exposure shows only those added buildings and their losses; the aggregate starter plus added portfolio, including gross and net treaty results, is available at `#portfolio`. The full gross/net EP curve is at `#loss-curve`. A starter-only run opens `#portfolio`. Requires the API.
- `/app/` — redirects to `/dashboard/#workspace`. The workspace also uploads property documents, maps extracted coordinates, and calculates a separate single-occurrence loss waterfall from reviewed financial and treaty inputs.

The homepage uses the CloudFront video and poster URLs specified in the design prompt. Its navigation and calls to action link to the Nairobi dashboard, its sections, and sign-in.

The dashboard portfolio uses sample exposure and its model losses remain illustrative under the documented assumptions. The document loss workspace keeps that portfolio out of its calculations and requires a verified ground-up loss and contract terms.

For a production build, run `npm run build`.
