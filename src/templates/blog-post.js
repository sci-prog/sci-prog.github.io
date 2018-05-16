import React from 'react'
import Helmet from 'react-helmet'
import ReactDisqusComments from 'react-disqus-comments'
import get from 'lodash/get'
import AuthorBio from '../components/AuthorBio'

import { rhythm, scale } from '../utils/typography'

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = get(this.props, 'data.site.siteMetadata.title')
    const siteUrl = get(this.props, 'data.site.siteMetadata.siteUrl')
    const postUrl = `${siteUrl}${post.fields.slug}`
    const postIdentifier = post.fields.slug.replace(/\//g, '')
    const authors = get(this.props, 'data.site.siteMetadata.authors')
    const author = authors.find(
      author => author.github === post.frontmatter.author
    )

    console.log(authors)

    return (
      <div>
        <Helmet title={`${post.frontmatter.title} | ${siteTitle}`} />
        <h1>{post.frontmatter.title}</h1>
        <p
          style={{
            ...scale(-1 / 5),
            display: 'block',
            marginBottom: rhythm(1 / 2),
            marginTop: rhythm(1 / 2),
          }}
        >
          {post.frontmatter.date}
        </p>
        {author && (
          <AuthorBio
            photo={author.photo}
            name={author.name}
            github={author.github}
            bio={author.bio}
          />
        )}
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <div id='comments'>
          <ReactDisqusComments
            shortname={process.env.DQ_SHORTNAME}
            identifier={`${postIdentifier}-1`}
            title={post.frontmatter.title}
            url={postUrl}
          />
        </div>
      </div>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        siteUrl
        authors {
          name
          photo
          github
          bio
        }
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        author
      }
      fields {
        slug
      }
    }
  }
`
