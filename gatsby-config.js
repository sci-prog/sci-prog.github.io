module.exports = {
  siteMetadata: {
    title: 'Scientific Programming Blog',
    description: 'Un blog de programación científica enfocado en high performance computing',
    siteUrl: 'https://sci-prog.github.io',
    repo: 'https://github.com/sci-prog/sci-prog.github.io',
    authors: [{
        name: 'Oscar Arbelaez',
        photo: 'https://avatars1.githubusercontent.com/u/1621518?s=460&v=4',
        github: 'odarbelaeze',
        bio: 'Simple programador de Colombia',
      },
      {
        name: 'Pablo Alcain',
        photo: 'https://avatars2.githubusercontent.com/u/6975120?s=400&v=4',
        github: 'pabloalcain',
        bio: 'Simple físico de Argentina',
      }
    ]
  },
  pathPrefix: '/',
  plugins: [{
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [{
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: 'language-',
            },
          },
          'gatsby-remark-copy-linked-files',
          'gatsby-remark-smartypants',
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-109737731-1`,
      },
    },
    `gatsby-plugin-feed`,
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: 'gatsby-plugin-typography',
      options: {
        pathToConfigModule: 'src/utils/typography',
      },
    },
  ],
}

