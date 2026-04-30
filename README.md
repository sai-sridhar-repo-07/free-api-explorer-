# Free API Explorer

Free API Explorer is a searchable directory of public APIs for developers, students, and makers who want to build projects faster.

Instead of scrolling through a long list of API links, this project gives people a cleaner way to discover APIs by category, authentication type, HTTPS support, browser CORS support, and documentation quality.

## What This Repo Is About

This repository contains a simple, static web app that organizes public API data into an easier browsing experience. It is made for anyone looking for an API for a side project, hackathon, learning app, dashboard, automation script, or prototype.

The goal is to make API discovery faster and more understandable. Each API is shown with practical details so users can quickly decide whether it fits their project.

## Why It Is Useful

- Helps developers find APIs without searching across many websites
- Saves time by showing category, auth, HTTPS, CORS, and docs status in one place
- Highlights reliable documentation links first
- Marks broken or suspicious documentation links instead of hiding the problem
- Gives beginners a friendlier way to explore APIs for project ideas
- Works as a lightweight static site with no backend required

## Main Features

- Search APIs by name, description, or category
- Filter APIs by category, auth type, HTTPS, CORS, and docs status
- View clear labels for verified docs, GitHub docs, protected docs, and links needing review
- Open official API documentation when available
- Use fallback documentation search when a source link needs review
- Pick a random API for project inspiration
- Browse a local catalog snapshot with over 1,400 API entries

## Documentation Quality

Free API Explorer does not blindly trust every source link. The catalog includes a link verification report so users can understand which documentation links are reliable and which ones may need manual review.

Current catalog snapshot:

- `1,426` APIs
- `51` categories
- `1,033` verified documentation links
- `113` GitHub-hosted documentation links
- `49` protected documentation links
- `231` links marked as needing review

## Who Can Use This

- Students looking for project APIs
- Developers building prototypes
- Hackathon participants
- Open-source contributors
- People learning API integration
- Anyone searching for free or public API resources

## Author

This app, interface, scripts, repository structure, and documentation are authored by the owner of this repository.

## Data Notice

The catalog data is transformed from the `public-apis/public-apis` project and its public API ecosystem. See [NOTICE](NOTICE) for attribution and license context.
