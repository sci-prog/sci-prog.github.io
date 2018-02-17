import React from 'react'

import Helmet from 'react-helmet'
import Link from 'gatsby-link'

class AboutPage extends React.Component {
  render() {
    const { title, repo } = this.props.data.site.siteMetadata
    const ContributorGuide = () => (
      <Link to="contributor-guide">
        guía para contribuir
      </Link>
    )
    const GithubRepo = () => (
      <a href={repo} target='_blank'>
        repositorio de github
      </a>
    )
    return (
      <div>
        <Helmet title={`About | ${title}`} />
        <h1>Acerca de</h1>
        <p>
          {title} es una iniciativa para agrupar conocimiento sobre
          programación científica en español. Los conocimientos a depositar en
          este blog van desde conceptos generales de administracion de
          proyectos de código abierto para aplicaciones científicas y cómo
          compartirlos, hasta detalles intrincados sobre optimización en
          lenguajes de bajo nivel.
        </p>
        <p>
          El espíritu del blog es incluyente y contribuciones externas son bien
          recibidas, si deseas aportar lee la <ContributorGuide /> y no dudes
          contactarnos a través del <GithubRepo />.
        </p>
      </div>
    )
  }
}

export default AboutPage

export const pageQuery = graphql`
  query BasicInfo {
    site {
      siteMetadata {
        title
        repo
      }
    }
  }
`
