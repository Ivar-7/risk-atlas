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
- `/dashboard/` — responsive Nairobi flood risk overview using the latest backend model run and OpenStreetMap tiles. Requires the API.
- `/app/` — dashboard and model workspace. The workspace uploads property documents, maps extracted coordinates, and calculates a single-occurrence loss waterfall from verified financial and treaty inputs. Requires the FastAPI service described in the repository README.

The homepage uses the CloudFront video and poster URLs specified in the design prompt. Its navigation and calls to action link to the Nairobi dashboard, its sections, and sign-in.

The dashboard portfolio uses sample exposure and its model losses remain illustrative under the documented assumptions. The document loss workspace keeps that portfolio out of its calculations and requires a verified ground-up loss and contract terms.

For a production build, run `npm run build`.
