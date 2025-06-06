import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { RootState } from '../../modules/reducer'
import { browse } from '../../modules/routing/actions'
import { getCategoryFromSection } from '../../modules/routing/search'
import {
  getAdjacentToRoad,
  getAssetType,
  getContracts,
  getCreators,
  getEmotePlayMode,
  getMaxDistanceToPlaza,
  getMaxEstateSize,
  getMaxPrice,
  getMinDistanceToPlaza,
  getMinEstateSize,
  getMinPrice,
  getNetwork,
  getOnlyOnRent,
  getOnlyOnSale,
  getRentalDays,
  getRarities,
  getSection,
  getStatus,
  getWearableGenders,
  getEmoteHasSound,
  getEmoteHasGeometry
} from '../../modules/routing/selectors'
import { getView } from '../../modules/ui/browse/selectors'
import { Section } from '../../modules/vendor/routing/types'
import { AssetStatusFilter } from '../../utils/filters'
import { LANDFilters } from '../Vendor/decentraland/types'
import { AssetFilters } from './AssetFilters'
import { MapDispatchProps, MapStateProps, OwnProps } from './AssetFilters.types'

const mapState = (state: RootState, ownProps: OwnProps): MapStateProps => {
  const { values = {} } = ownProps
  const section = 'section' in values ? (values.section as Section) : getSection(state)
  const contracts = 'contracts' in values ? values.contracts || [] : getContracts(state)
  const creators = 'creators' in values ? values.creators || [] : getCreators(state)
  const onlyOnSale = 'onlyOnSale' in values ? values.onlyOnSale : getOnlyOnSale(state)
  const onlyOnRent = 'onlyOnRent' in values ? values.onlyOnRent : getOnlyOnRent(state)
  let landStatus = LANDFilters.ALL_LAND

  if (onlyOnRent && !onlyOnSale) {
    landStatus = LANDFilters.ONLY_FOR_RENT
  } else if (onlyOnSale && !onlyOnRent) {
    landStatus = LANDFilters.ONLY_FOR_SALE
  }

  return {
    minPrice: 'minPrice' in values ? values.minPrice || '' : getMinPrice(state),
    maxPrice: 'maxPrice' in values ? values.maxPrice || '' : getMaxPrice(state),
    minEstateSize: 'minEstateSize' in values ? values.minEstateSize || '' : getMinEstateSize(state),
    maxEstateSize: 'maxEstateSize' in values ? values.maxEstateSize || '' : getMaxEstateSize(state),
    rarities: 'rarities' in values ? values.rarities || [] : getRarities(state),
    status: 'status' in values ? values.status : (getStatus(state) as AssetStatusFilter),
    network: 'network' in values ? values.network : getNetwork(state),
    bodyShapes: 'wearableGenders' in values ? values.wearableGenders : getWearableGenders(state),
    category: section ? getCategoryFromSection(section) : undefined,
    isOnSale: onlyOnSale,
    emotePlayMode: values.emotePlayMode || getEmotePlayMode(state),
    assetType: getAssetType(state),
    collection: contracts[0],
    creators,
    landStatus,
    view: getView(state),
    section,
    rentalDays: 'rentalDays' in values ? values.rentalDays : getRentalDays(state),
    minDistanceToPlaza: 'minDistanceToPlaza' in values ? values.minDistanceToPlaza : getMinDistanceToPlaza(state),
    maxDistanceToPlaza: 'maxDistanceToPlaza' in values ? values.maxDistanceToPlaza : getMaxDistanceToPlaza(state),
    adjacentToRoad: 'adjacentToRoad' in values ? values.adjacentToRoad : getAdjacentToRoad(state),
    emoteHasSound: 'emoteHasSound' in values ? values.emoteHasSound : getEmoteHasSound(state),
    emoteHasGeometry: 'emoteHasGeometry' in values ? values.emoteHasGeometry : getEmoteHasGeometry(state)
  }
}

const mapDispatch = (dispatch: Dispatch, ownProps: OwnProps): MapDispatchProps => {
  return {
    onBrowse: options => (ownProps.onFilterChange ? ownProps.onFilterChange(options) : dispatch(browse(options)))
  }
}

export default connect(mapState, mapDispatch)(AssetFilters)
