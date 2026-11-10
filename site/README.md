# OnKey website

The landing page and docs for OnKey: Next.js (App Router) with Tailwind, built as a fully static site.

```sh
cd site
npm install
npm run dev       # http://localhost:3080
npm run build     # static files in site/out/
npm run serve     # serve site/out/ on http://localhost:3080
```

## Deploying

The site is on Cloudflare Pages: project root `site`, build command `npm run build`, output directory `out`.
Any static host works the same way, since the export uses no server functions. For a project site served under
`/<repo>/` (GitHub Pages without a custom domain), build with `BASE_PATH=/<repo> npm run build`.

## Settings

Everything that changes between releases is in the `LAUNCH` block at the top of `lib/site.ts`.
`npm run build` lists any that are empty.

| Key | What | When empty |
|---|---|---|
| `githubUrl` | the GitHub repository | (required) |
| `downloadUrl` | the notarised `OnKey.dmg` | the repo's latest-release page |
| `windowsIssueUrl` | the "Want Windows?" issue | the repo's issue list |
| `contactEmail` | the contact address | "(address to come)" |
| `siteUrl` | the site's own address | no link previews |
| `plausibleDomain` | Plausible's site name: cookieless page counts | no Plausible script |
| `flowMynaTrackerId` | Flow Myna website tracker (`fm_…`): cookieless visit paths, only on the live domain | no Flow Myna script |
| `discordUrl` | the Discord invite | no Discord links |
| `demoVideo` (+ `demoPoster`) | the demo video's address and its still | the lane illustration |
| `notarised` | whether the download is notarised by Apple | install steps explain "Open Anyway" |

Keep the numbers on `docs/scoring` in step with the latest measurements.
