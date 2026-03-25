import {fetchCryptoAsset} from '@/data/coingecko';
import {fetchYahooAsset} from '@/data/yahoo';
import type {AssetType, NormalizedAssetData} from '@/types';

export async function getAssetData(ticker: string, assetType: AssetType): Promise<NormalizedAssetData> {
  if (assetType === 'crypto') {
    return fetchCryptoAsset(ticker);
  }

  return fetchYahooAsset(ticker, assetType);
}
