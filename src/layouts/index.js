import React from 'react'
import Link from 'gatsby-link'
import { Container } from 'react-responsive-grid'
import get from 'lodash/get'

import { rhythm, scale } from '../utils/typography'

require('prismjs/themes/prism.css')


class Template extends React.Component {
  render() {
    const { location, children } = this.props
    const siteTitle = 'Scientific Programming Blog'
    const siteDescription =  `
      Un blog de ciencia computacional enfocado en high performance computing
    `
    const repo = 'https://github.com/sci-prog/sci-prog.github.io'

    let header

    let rootPath = `/`
    if (typeof __PREFIX_PATHS__ !== `undefined` && __PREFIX_PATHS__) {
      rootPath = __PATH_PREFIX__ + `/`
    }

    if (location.pathname === rootPath) {
      header = (
        <h1
          style={{
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0,
          }}
        >
          <Link
            style={{
              boxShadow: 'none',
              textDecoration: 'none',
              color: 'inherit',
            }}
            to={'/'}
          >
            {siteTitle}
          </Link>
        </h1>
      )
    } else {
      header = (
        <h3
          style={{
            fontFamily: 'Montserrat, sans-serif',
            marginTop: 0,
            marginBottom: rhythm(-1),
          }}
        >
          <Link
            style={{
              boxShadow: 'none',
              textDecoration: 'none',
              color: 'inherit',
            }}
            to={'/'}
          >
            {siteTitle}
          </Link>
        </h3>
      )
    }
    return (
      <Container
        style={{
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        {header}
        {children()}

        <hr />

        <footer>
          <small>{siteDescription}</small>
          <div
            style={{
              padding: rhythm(0.5),
              fontSize: scale(0.5),
            }}
          >
            <Link to="about">Acerca de</Link>
            <br />
            <Link to="/">Artículos</Link>
            <br />
            <a href={repo} target='_blank'>Github repo</a>
          </div>
        </footer>

      </Container>
    )
  }
}

export default Template
