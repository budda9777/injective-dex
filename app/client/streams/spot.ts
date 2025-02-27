import {
  IndexerGrpcSpotStream,
  SpotOrderbookStreamCallback,
  SpotOrdersStreamCallback,
  SpotOrderHistoryStreamCallback,
  SpotTradesStreamCallback
} from '@injectivelabs/sdk-ts'
import { TradeExecutionSide } from '@injectivelabs/ts-types'
import { streamProvider } from '../../providers/StreamProvider'
import { ENDPOINTS } from '@/app/utils/constants'
import { StreamType } from '@/types'

export const spotMarketStream = new IndexerGrpcSpotStream(ENDPOINTS.indexer)

export const cancelOrderbookStream = () => {
  streamProvider.cancel(StreamType.SpotOrderbook)
}

export const cancelTradesStream = () => {
  streamProvider.cancel(StreamType.SpotTrades)
}

export const cancelSubaccountOrdersStream = () => {
  streamProvider.cancel(StreamType.SpotSubaccountOrders)
}

export const cancelSubaccountOrdersHistoryStream = () => {
  streamProvider.cancel(StreamType.SpotSubaccountOrderHistory)
}

export const cancelSubaccountTradesStream = () => {
  streamProvider.cancel(StreamType.SpotSubaccountTrades)
}

export const streamOrderbook = ({
  marketId,
  callback
}: {
  marketId: string
  callback: SpotOrderbookStreamCallback
}) => {
  const streamFn = spotMarketStream.streamSpotOrderbook.bind(spotMarketStream)
  const streamFnArgs = {
    marketIds: [marketId],
    callback
  }

  streamProvider.subscribe({
    fn: streamFn,
    args: streamFnArgs,
    key: StreamType.SpotOrderbook
  })
}

export const streamTrades = ({
  marketId,
  callback
}: {
  marketId: string
  callback: SpotTradesStreamCallback
}) => {
  const streamFn = spotMarketStream.streamSpotTrades.bind(spotMarketStream)
  const streamFnArgs = {
    marketId,
    callback,
    executionSide: TradeExecutionSide.Taker
  }

  streamProvider.subscribe({
    fn: streamFn,
    args: streamFnArgs,
    key: StreamType.SpotTrades
  })
}

export const streamSubaccountTrades = ({
  marketId,
  callback,
  subaccountId
}: {
  marketId?: string
  subaccountId?: string
  callback: SpotTradesStreamCallback
}) => {
  const streamFn = spotMarketStream.streamSpotTrades.bind(spotMarketStream)
  const streamFnArgs = {
    ...(subaccountId && { subaccountId }),
    ...(marketId && { marketId }),
    callback
  }

  streamProvider.subscribe({
    fn: streamFn,
    args: streamFnArgs,
    key: StreamType.SpotSubaccountTrades
  })
}

export const streamSubaccountOrders = ({
  marketId,
  callback,
  subaccountId
}: {
  marketId?: string
  subaccountId?: string
  callback: SpotOrdersStreamCallback
}) => {
  const streamFn = spotMarketStream.streamSpotOrders.bind(spotMarketStream)
  const streamFnArgs = {
    ...(subaccountId && { subaccountId }),
    ...(marketId && { marketId }),
    callback
  }

  streamProvider.subscribe({
    fn: streamFn,
    args: streamFnArgs,
    key: StreamType.SpotSubaccountOrders
  })
}

export const streamSubaccountOrderHistory = ({
  marketId,
  callback,
  subaccountId
}: {
  marketId?: string
  subaccountId?: string
  callback: SpotOrderHistoryStreamCallback
}) => {
  const streamFn =
    spotMarketStream.streamSpotOrderHistory.bind(spotMarketStream)
  const streamFnArgs = {
    ...(subaccountId && { subaccountId }),
    ...(marketId && { marketId }),
    callback
  }

  streamProvider.subscribe({
    fn: streamFn,
    args: streamFnArgs,
    key: StreamType.SpotSubaccountOrderHistory
  })
}
