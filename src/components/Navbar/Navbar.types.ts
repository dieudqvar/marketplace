import { AuthIdentity } from '@dcl/crypto'

export type Props = {
  hasPendingTransactions: boolean
  enablePartialSupportAlert?: boolean
  identity?: AuthIdentity
  mana?: number
  avatar: string
  network?: string
  className?: string
}

export type OwnProps = Pick<Props, 'enablePartialSupportAlert'>

export type MapStateProps = Pick<Props, 'hasPendingTransactions' | 'identity' | 'mana' | 'avatar' | 'network'>