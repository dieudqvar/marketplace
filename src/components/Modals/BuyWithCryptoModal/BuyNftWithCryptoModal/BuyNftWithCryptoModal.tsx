import React, { useCallback, useMemo } from 'react'
import { Contract, NFTCategory } from '@dcl/schemas'
import withAuthorizedAction from 'decentraland-dapps/dist/containers/withAuthorizedAction'
import { AuthorizedAction } from 'decentraland-dapps/dist/containers/withAuthorizedAction/AuthorizationModal'
import { getAnalytics } from 'decentraland-dapps/dist/modules/analytics'
import { AuthorizationType } from 'decentraland-dapps/dist/modules/authorization'
import { ContractName, getContract as getDCLContract } from 'decentraland-transactions'
import { useFingerprint } from '../../../../modules/nft/hooks'
import { getBuyItemStatus, getError } from '../../../../modules/order/selectors'
import { getContractNames } from '../../../../modules/vendor'
import { Contract as DCLContract } from '../../../../modules/vendor/services'
import * as events from '../../../../utils/events'
import BuyWithCryptoModal from '../BuyWithCryptoModal.container'
import { OnGetCrossChainRoute, OnGetGasCost } from '../BuyWithCryptoModal.types'
import { useBuyNftGasCost, useCrossChainBuyNftRoute } from '../hooks'
import { Props } from './BuyNftWithCryptoModal.types'

const BuyNftWithCryptoModalHOC = (props: Props) => {
  const {
    name,
    credits,
    isExecutingOrder,
    connectedChainId,
    isExecutingOrderCrossChain,
    isOffchainPublicNFTOrdersEnabled,
    onClose,
    isLoadingAuthorization,
    isUsingMagic,
    getContract,
    onAuthorizedAction,
    onExecuteOrder,
    onExecuteOrderCrossChain,
    onExecuteOrderWithCard,
    metadata: { nft, order, slippage = 1, useCredits = false }
  } = props

  const [fingerprint] = useFingerprint(nft)

  const onBuyNatively = useCallback(() => {
    const contractNames = getContractNames()

    const mana = getContract({
      name: contractNames.MANA,
      network: nft.network
    }) as DCLContract

    const marketplace = getContract({
      address: order.marketplaceAddress,
      network: nft.network
    }) as DCLContract

    const offchainMarketplace =
      isOffchainPublicNFTOrdersEnabled && order?.tradeId && getDCLContract(ContractName.OffChainMarketplace, nft.chainId)
    let creditsManager
    try {
      creditsManager = getDCLContract(ContractName.CreditsManager, nft.chainId)
    } catch (error) {
      console.log('Error getting credit manager', error)
    }

    const areCreditsEnoughToBuy = useCredits && credits && BigInt(credits.totalCredits) >= BigInt(order.price)
    const needsToAuthorizeCredits = useCredits && !areCreditsEnoughToBuy

    const authorizedAddress =
      needsToAuthorizeCredits && creditsManager
        ? creditsManager.address
        : offchainMarketplace
          ? offchainMarketplace.address
          : order.marketplaceAddress
    const authorizedContractLabel =
      needsToAuthorizeCredits && creditsManager
        ? creditsManager.name
        : offchainMarketplace
          ? offchainMarketplace.name
          : marketplace.label || marketplace.name

    onAuthorizedAction({
      // Override the automatic Magic sign in if the user needs to pay gas for the transaction
      manual: connectedChainId === nft.chainId,
      targetContractName: ContractName.MANAToken,
      authorizationType: AuthorizationType.ALLOWANCE,
      authorizedAddress,
      targetContract: mana as Contract,
      authorizedContractLabel,
      requiredAllowanceInWei: useCredits && credits ? (BigInt(order.price) - BigInt(credits.totalCredits)).toString() : order.price,
      onAuthorized: (alreadyAuthorized: boolean) => onExecuteOrder(order, nft, fingerprint, !alreadyAuthorized, useCredits) // undefined as fingerprint
    })
  }, [nft, order, fingerprint, getContract, onAuthorizedAction, onExecuteOrder, useCredits, credits])

  const onBuyWithCard = useCallback(() => {
    getAnalytics()?.track(events.CLICK_BUY_NFT_WITH_CARD)
    onExecuteOrderWithCard(nft, order, useCredits)
  }, [nft, order, useCredits, onExecuteOrderWithCard])

  const onGetCrossChainRoute: OnGetCrossChainRoute = useCallback(
    (selectedToken, selectedChain, providerTokens, crossChainProvider, wallet) =>
      useCrossChainBuyNftRoute(order, order.chainId, selectedToken, selectedChain, providerTokens, crossChainProvider, wallet, slippage),
    [order]
  )
  const onGetGasCost: OnGetGasCost = useCallback(
    (selectedToken, chainNativeToken, wallet) => useBuyNftGasCost(nft, order, selectedToken, chainNativeToken, wallet, fingerprint),
    [nft, order, fingerprint]
  )

  const price = useMemo(() => {
    if (!useCredits || !credits) return order.price
    const adjustedPrice = BigInt(order.price) - BigInt(credits.totalCredits)
    // Convert back to wei format
    return adjustedPrice < 0 ? '0' : adjustedPrice.toString()
  }, [order.price, useCredits, credits])

  return (
    <BuyWithCryptoModal
      price={price}
      useCredits={useCredits}
      isBuyingAsset={isExecutingOrder || isExecutingOrderCrossChain}
      onBuyNatively={onBuyNatively}
      onBuyWithCard={nft.category === NFTCategory.ESTATE || nft.category === NFTCategory.PARCEL ? undefined : onBuyWithCard}
      onBuyCrossChain={onExecuteOrderCrossChain}
      onGetGasCost={onGetGasCost}
      isUsingMagic={isUsingMagic}
      isLoadingAuthorization={isLoadingAuthorization}
      onGetCrossChainRoute={onGetCrossChainRoute}
      metadata={{ asset: nft }}
      name={name}
      onClose={onClose}
    />
  )
}

export const BuyNftWithCryptoModal = React.memo(
  withAuthorizedAction(
    BuyNftWithCryptoModalHOC,
    AuthorizedAction.BUY,
    {
      action: 'buy_with_mana_page.authorization.action',
      title_action: 'buy_with_mana_page.authorization.title_action'
    },
    getBuyItemStatus,
    getError
  )
)
