# Science Site App

A Minimal & Beautiful Gatsby Personal Blog With Nice Glassmorphism UI.

## Features

-   Fully responsive
-   SEO metadata and Open Graph tags
-   Maximized lighthouse score
-   Contact form with Netlify Form
-   Edit Content with Netlify CMS
-   Easy to deploy
-   Syntax highlighting via PrismJS

## Local Install

yarn start

```bash
# 1. Clone the repository
git clone https://github.com/cloudM10/science-app

# 2. Navigate into repository
cd science-app

# 3. Install the dependencies
npm install

# 4. Start the development server
npm run dev

# 5. Build for production
npm run build
```

## Configuration

Within gatsby-config.js, you can specify information about your site (metadata) like the site title and description to properly generate meta tags.

```js
// gatsby-config.js

module.exports = {
    siteMetadata: {
        title: `Science Site`,
        author: {
            name: `Vadim I.`,
            summary: ``,
        },
        description: `A science site`,
        siteUrl: `https://science-site.netlify.app/`,
    },

    // ...
};
```

## Deployment

The project is configured for Vercel. Once the repository is connected, Vercel will build the Gatsby site and expose the serverless OAuth endpoints under `/api/*`.

1. Push your changes to GitHub.
2. Create (or update) a Vercel project linked to `cloudM10/science-app`.
3. Add the environment variables listed in [GitHub OAuth provider](#github-oauth-provider-on-vercel).
4. Trigger a deploy. Gatsby will generate the static site while the OAuth provider is deployed as Vercel serverless functions.

## GitHub OAuth provider on Vercel

The `/api/auth` and `/api/callback` serverless functions embed the behaviour of [`netlify-cms-github-oauth-provider`](https://github.com/vencax/netlify-cms-github-oauth-provider) so Netlify CMS can authenticate editors when the site is hosted on Vercel.

### 1. Create a GitHub OAuth App

1. Open <https://github.com/settings/developers> and create a new **OAuth App**.
2. Set the **Authorization callback URL** to `https://<your-domain>/api/callback` (replace with your production domain).
3. Copy the generated **Client ID** and **Client Secret**.

### 2. Configure Vercel environment variables

Add these variables in the Vercel dashboard (Project Settings → Environment Variables):

| Variable                      | Required       | Description                                                                                                                                                                  |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OAUTH_CLIENT_ID`             | ✅             | Client ID from your GitHub OAuth App.                                                                                                                                        |
| `OAUTH_CLIENT_SECRET`         | ✅             | Client Secret from your GitHub OAuth App.                                                                                                                                    |
| `ORIGINS`                     | ✅             | Comma-separated list of allowed origins **without protocol**, e.g. `science-app-umber.vercel.app,www.example.com,localhost:8000`. Wildcards (`*.example.com`) are supported. |
| `REDIRECT_URL`                | ✅             | Public callback URL, e.g. `https://science-app-umber.vercel.app/api/callback`.                                                                                               |
| `SCOPES`                      | ⛔️ (optional) | Override the default GitHub scopes (`repo,user`).                                                                                                                            |
| `AUTH_TARGET`                 | ⛔️ (optional) | Set to `_blank` to force the login window to open in a new tab.                                                                                                              |
| `GATSBY_NETLIFY_CMS_BASE_URL` | ⛔️ (optional) | Override the OAuth base URL used by the CMS client. Defaults to `https://science-app-umber.vercel.app/api`.                                                                  |

Deployments automatically pick up the new values—redeploy if you change them.

#### Runtime overrides (advanced)

During local development (or if you need to hot-swap the OAuth endpoint without rebuilding), you can provide the base URL at runtime. The CMS bootstrap script looks for the value in the following order:

1. `window.GATSBY_NETLIFY_CMS_BASE_URL`
2. `window.__ENV__.GATSBY_NETLIFY_CMS_BASE_URL`
3. `window.__RUNTIME_CONFIG__.GATSBY_NETLIFY_CMS_BASE_URL`
4. `<meta name="netlify-cms-base-url" content="..." />`
5. The build-time `process.env.GATSBY_NETLIFY_CMS_BASE_URL`

This makes it easy to inject a custom value from a snippet in `static/admin/index.html`, a small runtime config file, or your hosting platform if it supports tag substitutions.

### 3. Update Netlify CMS config (if domains change)

The CMS backend in `static/admin/config.yml` is preconfigured for `https://science-app-umber.vercel.app/api`. If you switch domains, update the `base_url` (and the optional `GATSBY_NETLIFY_CMS_BASE_URL`) to match the new host.

## Manually Editing contents

### Blog Posts

Blog contents can be updated in markdown format at `content/blog`. Delete placeholder posts and start blogging.

```md
---
title: Hello World
date: "2021-05-01"
description: "Hello World"
---

This top portion is the beginning of the post and will show up as the excerpt on the homepage.
```

### Pages

Homepage intro, Contact, and About page content can be updated in Markdown format at `content/pages`.

# Editing Contents with Netlify CMS

This project is preconfigured to work with Netlify CMS.
When Netlify CMS makes commits to your repo, Netlify will auto-trigger a rebuild / deploy when new commits are made.
You’ll need to set up Netlify’s Identity service to authorize users to log in to the CMS.

-   Go to <https://app.netlify.com> > select your website from the list.
-   Go to Identity and click Enable Identity.
-   Click on Invite Users and invite yourself. You will receive an email and you need to accept the invitation to set the password.
-   Now headover to Settings > Identity > Services and Enable Git Gateway.
-   You can also manage who can register and log in to your CMS. Go to Settings > Identity > Registration Registration Preferences. I would prefer to keep it to Invite Only if I am the only one using it.
-   Now, go to to site-name.netlify.app/admin/, and login with your credentials.

Once you are in your Netlify CMS, you can navigate to Posts and Pages. Here you will find a list of existing pages and posts.

## Built with

-   Gatsby for Static Site Generation
-   Netlify CMS for content management
-   Styled Component for styling
