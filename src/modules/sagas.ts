import { createFetchComponent } from '@well-known-components/fetch-component'
import { createContentClient } from 'dcl-catalyst-client/dist/client/ContentClient'
import { createLambdasClient } from 'dcl-catalyst-client/dist/client/LambdasClient'
import { all } from 'redux-saga/effects'
import { createAnalyticsSaga } from 'decentraland-dapps/dist/modules/analytics/sagas'
import { authorizationSaga } from 'decentraland-dapps/dist/modules/authorization/sagas'
import { ContentfulClient } from 'decentraland-dapps/dist/modules/campaign/ContentfulClient'
import { campaignSagas } from 'decentraland-dapps/dist/modules/campaign/sagas'
import { CreditsClient } from 'decentraland-dapps/dist/modules/credits/CreditsClient'
import { creditsSaga } from 'decentraland-dapps/dist/modules/credits/sagas'
import { featuresSaga } from 'decentraland-dapps/dist/modules/features/sagas'
import { ApplicationName } from 'decentraland-dapps/dist/modules/features/types'
import { createGatewaySaga } from 'decentraland-dapps/dist/modules/gateway/sagas'
import { FiatGateway } from 'decentraland-dapps/dist/modules/gateway/types'
import { createIdentitySaga } from 'decentraland-dapps/dist/modules/identity/sagas'
import { createProfileSaga } from 'decentraland-dapps/dist/modules/profile/sagas'
import { TradeService } from 'decentraland-dapps/dist/modules/trades/TradeService'
import { transactionSaga } from 'decentraland-dapps/dist/modules/transaction/sagas'
import { NetworkGatewayType } from 'decentraland-ui/dist/components/BuyManaWithFiatModal/Network'
import { AuthIdentity } from 'decentraland-crypto-fetch'
import { config } from '../config'
import { API_SIGNER } from '../lib/api'
import { peerUrl } from '../lib/environment'
import { accountSaga } from './account/sagas'
import { analyticsSagas as marketplaceAnalyticsSagas } from './analytics/sagas'
import { assetSaga } from './asset/sagas'
import { bidSaga } from './bid/sagas'
import { collectionSaga } from './collection/sagas'
import { contractSaga } from './contract/sagas'
import { ensSaga } from './ens/sagas'
import { eventSaga } from './event/sagas'
import { favoritesSaga } from './favorites/sagas'
import { identitySaga } from './identity/sagas'
import { itemSaga } from './item/sagas'
import { loginSaga } from './login/sagas'
import { modalSaga } from './modal/sagas'
import { nftSaga } from './nft/sagas'
import { orderSaga } from './order/sagas'
import { proximitySaga } from './proximity/sagas'
import { rentalSaga } from './rental/sagas'
import { routingSaga } from './routing/sagas'
import { saleSaga } from './sale/sagas'
import { storeSaga } from './store/sagas'
import { tileSaga } from './tile/sagas'
import { toastSaga } from './toast/sagas'
import { transakSaga } from './transak/sagas'
import { translationSaga } from './translation/sagas'
import { uiSaga } from './ui/sagas'
import { BidService, MARKETPLACE_SERVER_URL } from './vendor/decentraland'
import { walletSaga } from './wallet/sagas'

const analyticsSaga = createAnalyticsSaga()
const profileSaga = (getIdentity: () => AuthIdentity | undefined) => createProfileSaga({ getIdentity, peerUrl })
const lambdasClient = createLambdasClient({
  url: `${peerUrl}/lambdas`,
  fetcher: createFetchComponent()
})
const contentClient = createContentClient({
  url: `${peerUrl}/content`,
  fetcher: createFetchComponent()
})

const newIdentitySaga = createIdentitySaga({
  authURL: config.get('AUTH_URL')
})

const gatewaySaga = createGatewaySaga({
  [FiatGateway.WERT]: {
    marketplaceServerURL: config.get('MARKETPLACE_SERVER_URL'),
    url: config.get('WERT_API_URL')
  },
  [NetworkGatewayType.MOON_PAY]: {
    apiBaseUrl: config.get('MOON_PAY_API_URL'),
    apiKey: config.get('MOON_PAY_API_KEY'),
    pollingDelay: +config.get('MOON_PAY_POLLING_DELAY'),
    widgetBaseUrl: config.get('MOON_PAY_WIDGET_URL')
  },
  [NetworkGatewayType.TRANSAK]: {
    apiBaseUrl: config.get('MARKETPLACE_SERVER_URL'),
    key: config.get('TRANSAK_KEY'),
    env: config.get('TRANSAK_ENV'),
    pollingDelay: +config.get('TRANSAK_POLLING_DELAY'),
    pusher: {
      appKey: config.get('TRANSAK_PUSHER_APP_KEY'),
      appCluster: config.get('TRANSAK_PUSHER_APP_CLUSTER')
    }
  }
})

const getCrossChainProvider = async () => {
  const { AxelarProvider } = await import('decentraland-transactions/crossChain')
  return AxelarProvider
}

const getTradesService = (getIdentity: () => AuthIdentity | undefined) => new TradeService(API_SIGNER, MARKETPLACE_SERVER_URL, getIdentity)

export function* rootSaga(getIdentity: () => AuthIdentity | undefined) {
  yield all([
    analyticsSaga(),
    assetSaga(),
    authorizationSaga(),
    bidSaga(new BidService(), getTradesService(getIdentity)),
    creditsSaga({ creditsClient: new CreditsClient(config.get('CREDITS_SERVER_URL')) }),
    itemSaga(getIdentity),
    nftSaga(getIdentity),
    orderSaga(getTradesService(getIdentity)),
    profileSaga(getIdentity)(),
    proximitySaga(),
    routingSaga(),
    tileSaga(),
    toastSaga(),
    campaignSagas(new ContentfulClient(), {
      space: config.get('CONTENTFUL_SPACE_ID'),
      environment: config.get('CONTENTFUL_ENVIRONMENT'),
      id: config.get('CONTENTFUL_ADMIN_ENTITY_ID')
    }),
    transactionSaga({
      crossChainProviderUrl: config.get('SQUID_API_URL'),
      crossChainProviderRetryDelay: Number(config.get('SQUID_RETRY_DELAY')),
      getCrossChainProvider
    }),
    translationSaga(),
    uiSaga(),
    walletSaga(),
    collectionSaga(),
    saleSaga(),
    accountSaga(lambdasClient),
    collectionSaga(),
    storeSaga(contentClient),
    identitySaga(),
    newIdentitySaga(),
    marketplaceAnalyticsSagas(),
    featuresSaga({
      polling: {
        apps: [ApplicationName.MARKETPLACE, ApplicationName.DAPPS, ApplicationName.EXPLORER],
        delay: 60000 /** 60 seconds */
      }
    }),
    rentalSaga(),
    modalSaga(),
    eventSaga(),
    contractSaga(),
    gatewaySaga(),
    transakSaga(),
    favoritesSaga(getIdentity),
    loginSaga(),
    ensSaga()
  ])
}
