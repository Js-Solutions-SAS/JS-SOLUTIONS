This is the JS Solutions Admin microfrontend built with [Next.js](https://nextjs.org) + Tailwind CSS.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tailwind Stability (Important)

This project had intermittent dev cache corruption (`.next` / webpack cache) that could make styles look uncompiled.

- `npm run dev` now clears cache automatically before starting Next.js.
- If you need faster startup (without cache cleanup), use:

```bash
npm run dev:fast
```

- Manual recovery command:

```bash
npm run clean:cache
```

Then restart:

```bash
npm run dev
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
