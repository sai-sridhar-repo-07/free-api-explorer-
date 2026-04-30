# Free API Explorer

Free API Explorer is a fast, searchable directory of public APIs for builders, students, and side projects. It helps you find APIs by category, authentication type, HTTPS support, browser CORS support, and documentation quality.

The project turns a large public API catalog into a cleaner browsing experience with verified documentation status, useful filters, summary stats, and random API discovery.

## Live App

This is a static frontend project, so it can be hosted directly on GitHub Pages. After enabling Pages, open your repository's Pages URL to use the app.

## What It Does

Free API Explorer lets developers quickly discover APIs for side projects, hackathons, student apps, dashboards, prototypes, and learning projects. Instead of scrolling through a giant Markdown list, you can search, filter, and understand each API from a clean card-based interface.

## Features

- Search public APIs by name, description, or category
- Filter by category, auth type, HTTPS support, CORS support, and docs status
- Open verified docs, GitHub-hosted docs, or fallback documentation search
- Random API picker for project inspiration
- Local JSON catalog snapshot in `data/apis.json`
- Link verification report in `data/link-report.json`
- Static, dependency-free frontend that can run on GitHub Pages

## Documentation Status

The project checks every API documentation URL and labels it clearly:

- `Verified docs`: the docs URL responded successfully
- `GitHub docs`: the API documentation is hosted in a GitHub repository or GitHub Pages site
- `Protected docs`: the site exists but blocks automated checks with auth, rate limits, or bot protection
- `Needs review`: the docs URL returned an error such as 404 or could not be reached

The default app view focuses on reliable documentation so users do not immediately run into broken links.

## Project Structure

```txt
.
├── index.html
├── styles.css
├── app.js
├── favicon.svg
├── data/
│   ├── apis.json
│   ├── link-report.json
│   └── upstream-public-apis.md
└── scripts/
    ├── build-data.js
    └── verify-links.js
```

## Run Locally

Serve the folder with any static server.

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Current Catalog Stats

- `1,426` APIs
- `51` categories
- `1,034` verified documentation links
- `113` GitHub-hosted documentation links
- `48` protected documentation links
- `231` links marked as needing review

## Refresh The Catalog

Download a fresh upstream README snapshot, then rebuild the local JSON data.

```bash
curl -L https://raw.githubusercontent.com/public-apis/public-apis/master/README.md -o data/upstream-public-apis.md
node scripts/build-data.js
```

## Verify Links

Run the verifier after refreshing data. It follows redirects, records status codes, and marks docs as verified, GitHub-hosted, protected, or needing review.

```bash
node scripts/verify-links.js 24
```

## Deploy On GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to repository `Settings`.
3. Open `Pages`.
4. Select the main branch and root folder.
5. Save, then open the published GitHub Pages URL.

## Author

This app, interface, scripts, repository structure, and documentation are authored by the owner of this repository.

## Data Notice

The catalog data is transformed from the `public-apis/public-apis` project and its public API ecosystem. See [NOTICE](NOTICE) for attribution and license context.
