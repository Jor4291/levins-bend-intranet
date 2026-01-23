This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Quick Links

- Spec: `levins-bend-intranet-spec.md`
- Getting Started: `README.md` (this file)
- Branch Protection: `README.md` -> "Branch protection setup"

## Project Overview

This repository hosts the Levin's Bend intranet web application.

For full scope, requirements, data model, and UX guidance, see
`levins-bend-intranet-spec.md`.

### Expectations

- Keep changes small and reviewable
- Prefer typed, reusable UI components
- Add tests for non-trivial logic

## Branching and PR Workflow

This repo uses protected branches for `main`.

- Create feature branches off `main`
- Open PRs into `main`
- Require at least one approval
- Require status checks to pass before merge
- Disallow force-pushes to `main`

See the "Branch protection setup" section below for steps.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Branch protection setup

Apply these in GitHub: `Settings` -> `Branches` -> `Branch protection rules`.

- Branch name pattern: `main`
- Require a pull request before merging
- Require approvals: 1+
- Require status checks to pass before merging
- Require conversation resolution
- Do not allow force pushes
