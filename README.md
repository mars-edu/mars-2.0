# MARS 2.0

Education Management System built with Vue 3, Convex, and Framework7.

## 📚 Documentation

**Comprehensive documentation is available in the [`/docs`](./docs) folder.**

- [Documentation Index](./docs/README.md) - Start here for guides and architecture overview
- Migrations — [@convex-dev/migrations](https://www.convex.dev/components/migrations) component; define in `convex/*Migrations.ts`, run via `npx convex run <file>:<name>` (see `convex/migrations.ts`)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development (Convex + Frontend)
npm run dev:all

# Or start separately
npm run dev:convex  # Convex backend
npm run dev         # Frontend only
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development (alias for dev:all) |
| `npm run dev:all` | Start Convex + Frontend dev servers |
| `npm run dev` | Start frontend dev server only |
| `npm run dev:convex` | Start Convex dev server only |
| `npm run build` | Build frontend for production |
| `npm run build:convex` | Deploy Convex backend (includes migrations) |
| `npm run migrate:status` | Show migration status (@convex-dev/migrations) |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run preview` | Preview production build |

## 🏗️ Tech Stack

- **Frontend**: Vue 3, TypeScript, Framework7, Pinia
- **Backend**: Convex (real-time database + serverless functions)
- **Build Tool**: Vite
- **Testing**: Jest, Playwright

## 📁 Project Structure

```
mars-2.0/
├── convex/          # Convex backend (schema, queries, mutations, actions)
├── src/             # Vue 3 frontend application
├── docs/            # Documentation
├── scripts/         # Build and utility scripts
├── backend/         # Legacy backend (being phased out)
└── .claude/         # Claude Code configuration
```

## Framework7 CLI Options

Framework7 app created with following options:

```
{
  "cwd": "/home/olge/SOFT/git/mars-2.0",
  "type": [
    "web"
  ],
  "name": "Mars",
  "framework": "vue",
  "template": "tabs",
  "cssPreProcessor": false,
  "bundler": "vite",
  "theming": {
    "customColor": false,
    "color": "#007aff",
    "darkMode": false,
    "iconFonts": true
  },
  "customBuild": false
}
```

## Install Dependencies

First of all we need to install dependencies, run in terminal
```
npm install
```

## NPM Scripts

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production

## Vite

There is a [Vite](https://vitejs.dev) bundler setup. It compiles and bundles all "front-end" resources. You should work only with files located in `/src` folder. Vite config located in `vite.config.js`.
## Assets

Assets (icons, splash screens) source images located in `assets-src` folder. To generate your own icons and splash screen images, you will need to replace all assets in this directory with your own images (pay attention to image size and format), and run the following command in the project directory:

```
framework7 assets
```

Or launch UI where you will be able to change icons and splash screens:

```
framework7 assets --ui
```



## Documentation & Resources

* [Framework7 Core Documentation](https://framework7.io/docs/)
* [Framework7 Vue Documentation](https://framework7.io/vue/)


* [Framework7 Icons Reference](https://framework7.io/icons/)
* [Community Forum](https://forum.framework7.io)

## Support Framework7

Love Framework7? Support project by donating or pledging on:
- Patreon: https://patreon.com/framework7
- OpenCollective: https://opencollective.com/framework7