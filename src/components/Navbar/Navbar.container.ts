import { connect } from 'react-redux'
import { TransactionStatus } from 'decentraland-dapps/dist/modules/transaction/types'
import { isPending } from 'decentraland-dapps/dist/modules/transaction/utils'
import { getCurrentIdentity } from '../../modules/identity/selectors'
import { RootState } from '../../modules/reducer'
import { getTransactions } from '../../modules/transaction/selectors'
import { getProfileOfAddress } from 'decentraland-dapps/dist/modules/profile/selectors'
import { getAddress, getWallet } from '../../modules/wallet/selectors'
import Navbar from './Navbar'
import { MapStateProps } from './Navbar.types'

const mapState = (state: RootState): MapStateProps => {
  const address = getAddress(state)
  const profile = address ? getProfileOfAddress(state, address) : null
  const avatar = profile?.avatars[0]?.avatar?.snapshots?.face256 || '/images/avatar.png'
  const wallet = getWallet(state)
  const mana = wallet?.networks?.ETHEREUM?.mana || 0
  const network = wallet?.network || 'Ethereum'

  return {
    hasPendingTransactions: getTransactions(state).some((tx: { status: TransactionStatus | null }) => isPending(tx.status)),
    identity: getCurrentIdentity(state) || undefined,
    avatar,
    mana,
    network
  }
}

export default connect(mapState)(Navbar)
