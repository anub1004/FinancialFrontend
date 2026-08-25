# Financial Application — Frontend

A React + Vite frontend for the Financial Application project.

## Project Overview

This repository contains the frontend for a financial application built with React (TypeScript), Vite, and modern web tooling. It provides authentication flows (login/signup) and the basic app shell and routing for the client UI.

## Features

- Authentication: Login and Signup pages
- Fast local development with Vite
- TypeScript support and ESLint configuration

## Tech Stack

- Framework: React + TypeScript
- Bundler: Vite
- Styling: CSS Modules
- Linting: ESLint

## Prerequisites

- Node.js (16+ recommended)
- npm or yarn

## Quick Start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment & Configuration

Basic API configuration is available in `src/config/apiconfig.js`. Adjust the base API URL and any relevant keys there before running the app in different environments.

## Folder Structure

- `index.html` — App host
- `src/` — Source code
	- `main.tsx` — App entry
	- `App.tsx` — App shell
	- `routes.tsx` — Routes configuration
	- `pages/` — Page components
		- `Auth/Login.tsx` — Login page
		- `Auth/Signup.tsx` — Signup page
	- `config/apiconfig.js` — API configuration

## Authentication

Login and Signup components are implemented in `src/pages/Auth/`. They rely on the API endpoints configured in `src/config/apiconfig.js` and expect JWT-based responses.

## Linting & Formatting

Linting is configured via `eslint.config.js`. To run linting (if script exists in `package.json`):

```bash
npm run lint
```

## Tests

This project does not include tests by default. Add your preferred testing framework (Vitest, Jest, etc.) and scripts to `package.json` if you want to enable automated tests.

## Deployment

Build the app with `npm run build` and serve the `dist/` output from a static hosting provider (Netlify, Vercel, GitHub Pages, or an S3/Blob static site).

## Contributing

Contributions are welcome. Open an issue or submit a pull request with a clear description of the change.

## License

Specify a license for your project (e.g., MIT) or contact the repository owner for details.

