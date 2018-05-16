/**
 * Bio component, just to make it part of the articles.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import github from '@fortawesome/fontawesome-free-brands/faGithub'
import './AuthorBio.css'


class AuthorBio extends Component {
  render() {
    return (
      <div className='author-bio'>
        <img
          className='author-bio-picture'
          src={this.props.photo}
          alt={this.props.name}
        />
        <div className='author-bio-details'>
          <strong>{this.props.name}</strong>
          <p>{this.props.bio}</p>
          <small>
            <a href={`https://github.com/${this.props.github}`} target='_blank'>
              <FontAwesomeIcon icon={github} /> {this.props.github}
            </a>
          </small>
        </div>
      </div>
    )
  }
}


AuthorBio.propTypes = {
  name: PropTypes.string.isRequired,
  github: PropTypes.string.isRequired,
  photo: PropTypes.string.isRequired,
  bio: PropTypes.string.isRequired,
}


export default AuthorBio
