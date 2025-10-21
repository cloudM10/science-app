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

```bash
# 1. Clone the repository
git clone https://github.com/vdmemory/science-site-app

# 2. Navigate into repository
cd science-site-app

# 3. Install the dependencies
yarn install

# 4. Start the development server
yarn start

# 5. Start the build mode
yarn  build
```

## Editing content locally without login

Whenever you run the development server (`yarn start` or `gatsby develop`), a Netlify CMS proxy server now starts automatically.

-   It mirrors the behavior of `netlify-cms-proxy-server`, so the `/admin` panel connects directly to your local files with no authentication required.
-   The proxy listens on port `8081` by default. Override it via `NETLIFY_CMS_PROXY_PORT` before starting the dev server.
-   Set `NETLIFY_CMS_PROXY_DISABLED=true` if you need to run Gatsby without the proxy (for example, when testing the hosted login flow).

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

Netlify is a great way to easily deploy sites plus this starter uses Netlify Form for the Contact form.

-   Generate a new repo from this repo which will copy all files from this repo to your newly created repo.

-   Go to <https://app.netlify.com>. Once you’ve logged in, click the 'New site from Git' button on your dashboard and choose your newly created repo.

-   Follow the prompts, it will build and deploy the new site on Netlify, bringing you to the site dashboard when the build is complete.

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
