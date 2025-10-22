module.exports = {
    siteMetadata: {
        title: `ОНП «Машини та обладнання в агропромисловому комплексі» («Галузеве машинобудування»)`,
        subtitle: `Дніпровський державний аграрно-економічний університет`,
        author: {
            name: `Vadim I.`,
            summary: ``,
        },
        openGraphImage: `open-graph-image.png`,
        description: `Сайт кафедри "Машини та обладнання в агропромисловому комплексі" Дніпровського державного аграрно-економічного університету`,
        siteUrl: `https://science-app-umber.vercel.app/`,
        socialLinks: [
            {
                name: "facebook",
                url: "https://www.facebook.com",
            },
            {
                name: "instagram",
                url: "https://instagram.com",
            },
        ],
        social: {
            twitter: `https://twitter.com`,
        },
    },
    plugins: [
        `gatsby-plugin-styled-components`,
        `gatsby-plugin-image`,
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        // Автоматически генерируемые источники данных из конфигурации
        ...(() => {
            const { DATA_SOURCES } = require("./src/config/app-configuration");

            return DATA_SOURCES.map((source) => ({
                resolve: `gatsby-source-filesystem`,
                options: {
                    name: source.name,
                    path: `${__dirname}/${source.path}`,
                },
            }));
        })(),
        {
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [
                    require.resolve("./plugins/gatsby-remark-netlify-table"),
                    {
                        resolve: require.resolve(
                            "./plugins/gatsby-remark-relative-images-local"
                        ),
                        options: {
                            staticFolderName: "static",
                        },
                    },
                    {
                        resolve: require.resolve(
                            "./plugins/gatsby-remark-relative-pdf-links"
                        ),
                        options: {
                            staticFolderName: "static",
                        },
                    },
                    {
                        resolve: `gatsby-remark-images`,
                        options: {
                            maxWidth: 630,
                        },
                    },
                    {
                        resolve: `gatsby-remark-responsive-iframe`,
                        options: {
                            wrapperStyle: `margin-bottom: 1.0725rem`,
                        },
                    },
                    `gatsby-remark-prismjs`,
                    `gatsby-remark-copy-linked-files`,
                    `gatsby-remark-smartypants`,
                ],
            },
        },
        {
            resolve: "gatsby-plugin-netlify-cms",
            options: {
                modulePath: `${__dirname}/src/netlify-cms/index.js`,
                enableIdentityWidget: false,
                manualInit: true,
                publicPath: "admin",
                htmlTitle: "Content Manager",
                includeRobots: false,
            },
        },
        {
            resolve: `gatsby-plugin-feed`,
            options: {
                query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
                feeds: [
                    {
                        serialize: ({ query: { site, allMarkdownRemark } }) => {
                            return allMarkdownRemark.nodes.map((node) => {
                                return Object.assign({}, node.frontmatter, {
                                    description: node.excerpt,
                                    date: node.frontmatter.date,
                                    url:
                                        site.siteMetadata.siteUrl +
                                        node.fields.slug,
                                    guid:
                                        site.siteMetadata.siteUrl +
                                        node.fields.slug,
                                    custom_elements: [
                                        { "content:encoded": node.html },
                                    ],
                                });
                            });
                        },
                        query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  nodes {
                    excerpt
                    html
                    fields {
                      slug
                    }
                    frontmatter {
                      title
                      date
                    }
                  }
                }
              }
            `,
                        output: "/rss.xml",
                        title: `Gatsby Glass RSS Feed`,
                    },
                ],
            },
        },
        {
            resolve: `gatsby-plugin-google-fonts`,
            options: {
                fonts: [`Source Sans Pro`, `Roboto Condensed\:300,400,700`],
                display: "swap",
            },
        },
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `Science Site`,
                short_name: `Science Site`,
                start_url: `/`,
                background_color: `#ccdcfbff`,
                theme_color: `#663399`,
                display: `minimal-ui`,
                icon: `src/images/icon.png`,
            },
        },
        `gatsby-plugin-react-helmet`,
    ],
};
