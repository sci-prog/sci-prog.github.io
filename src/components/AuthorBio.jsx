/**
 * Bio component, just to make it part of the articles.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
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
          <small>{this.props.email}</small>
        </div>
      </div>
    )
  }
}


AuthorBio.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  photo: PropTypes.string.isRequired,
  bio: PropTypes.string.isRequired,
}


export default AuthorBio
