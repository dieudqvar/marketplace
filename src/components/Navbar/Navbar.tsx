import React, { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { config } from '../../config'
import { locations } from '../../modules/routing/locations'
import { Props } from './Navbar.types'
import { shortenAddress } from '../../modules/wallet/utils'
import { getCurrentIdentity } from '../../modules/identity/selectors'
import './Navbar.css'

const Navbar = (props: Props) => {
  const { pathname, search } = useLocation()
  const history = useHistory()

  const handleOnSignIn = useCallback(() => {
    const searchParams = new URLSearchParams(search)
    const currentRedirectTo = searchParams.get('redirectTo')
    const basename = /^decentraland.(zone|org|today)$/.test(window.location.host) ? '/marketplace' : ''
    const redirectTo = !currentRedirectTo ? `${basename}${pathname}${search}` : `${basename}${currentRedirectTo}`

    window.location.replace(`${config.get('AUTH_URL')}/login?redirectTo=${redirectTo}`)
  }, [pathname, search])

  const handleOnClickAccount = useCallback(() => {
    history.push(locations.settings())
  }, [history])

  return (
    <div className="custom-navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <img src="icon.svg" alt="Logo" />
        </div>
      </div>
      <div className="navbar-right">
        {props.identity ? (
          <div className="account-info" onClick={handleOnClickAccount}>
            <div className="account-balance">
              <span className="mana-balance">{props.mana || 0} MANA</span>
            </div>
            <div className="account-avatar">
              <img src={props.avatar || '/images/avatar.png'} alt="Avatar" />
            </div>
            <div className="account-details">
              <span className="address">{shortenAddress(props.identity.authChain[0].payload)}</span>
              <span className="network">{props.network || 'Ethereum'}</span>
            </div>
          </div>
        ) : (
          <button className="sign-in-button" onClick={handleOnSignIn}>
            Sign In
          </button>
        )}
      </div>
    </div>
  )
}

export default React.memo(Navbar)
