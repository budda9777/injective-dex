import { SpotOrderState } from '@injectivelabs/sdk-ts'
import { StreamOperation } from '@injectivelabs/ts-types'
import {
  cancelOrderbookStream as grpcCancelOrderbookStream,
  cancelSubaccountOrdersHistoryStream as grpcCancelSubaccountOrdersHistoryStream,
  cancelSubaccountOrdersStream as grpcCancelSubaccountOrdersStream,
  cancelSubaccountTradesStream as grpcCancelSubaccountTradesStream,
  cancelTradesStream as grpcCancelTradesStream,
  streamOrderbook as grpcStreamOrderbook,
  streamTrades as grpcStreamTrades,
  streamSubaccountOrders as grpcStreamSubaccountOrders,
  streamSubaccountOrderHistory as grpcStreamSubaccountOrderHistory,
  streamSubaccountTrades as grpcStreamSubaccountTrade
} from '@/app/client/streams/spot'
import { TRADE_MAX_SUBACCOUNT_ARRAY_SIZE } from '@/app/utils/constants'

export const cancelOrderbookStream = grpcCancelOrderbookStream
export const cancelSubaccountOrdersStream = grpcCancelSubaccountOrdersStream
export const cancelSubaccountOrdersHistoryStream =
  grpcCancelSubaccountOrdersHistoryStream
export const cancelSubaccountTradesStream = grpcCancelSubaccountTradesStream
export const cancelTradesStream = grpcCancelTradesStream

export const streamOrderbook = (marketId: string) => {
  const spotStore = useSpotStore()

  grpcStreamOrderbook({
    marketId,
    callback: ({ orderbook }) => {
      if (!orderbook) {
        return
      }

      spotStore.$patch({
        orderbook
      })
    }
  })
}

export const streamTrades = (marketId: string) => {
  const spotStore = useSpotStore()

  grpcStreamTrades({
    marketId,
    callback: ({ trade, operation }) => {
      if (!trade) {
        return
      }

      // filter out non-tradable markets
      if (!marketId && !spotStore.activeMarketIds.includes(trade.marketId)) {
        return
      }

      switch (operation) {
        case StreamOperation.Insert:
          spotStore.$patch({
            trades: [trade, ...spotStore.trades]
          })
      }
    }
  })
}

export const streamSubaccountOrders = (marketId?: string) => {
  const spotStore = useSpotStore()

  const { subaccount } = useAccountStore()
  const { isUserWalletConnected } = useWalletStore()

  if (!isUserWalletConnected || !subaccount) {
    return
  }

  grpcStreamSubaccountOrders({
    subaccountId: subaccount.subaccountId,
    marketId,
    callback: ({ order }) => {
      if (!order) {
        return
      }

      // filter out non-tradable markets
      if (!marketId && !spotStore.activeMarketIds.includes(order.marketId)) {
        return
      }

      switch (order.state) {
        case SpotOrderState.Booked:
        case SpotOrderState.Unfilled:
        case SpotOrderState.PartialFilled: {
          const subaccountOrders = [
            order,
            ...spotStore.subaccountOrders.filter(
              (o) => o.orderHash !== order.orderHash
            )
          ].slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

          spotStore.$patch({
            subaccountOrders,
            subaccountOrdersCount: subaccountOrders.length
          })

          break
        }
        case SpotOrderState.Canceled:
        case SpotOrderState.Filled: {
          const subaccountOrders = spotStore.subaccountOrders
            .filter((o) => o.orderHash !== order.orderHash)
            .slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

          spotStore.$patch({
            subaccountOrders,
            subaccountOrdersCount: subaccountOrders.length
          })

          break
        }
      }
    }
  })
}

export const streamSubaccountOrderHistory = (marketId?: string) => {
  const spotStore = useSpotStore()

  const { subaccount } = useAccountStore()
  const { isUserWalletConnected } = useWalletStore()

  if (!isUserWalletConnected || !subaccount) {
    return
  }

  grpcStreamSubaccountOrderHistory({
    subaccountId: subaccount.subaccountId,
    marketId,
    callback: ({ order }) => {
      if (!order) {
        return
      }

      // filter out non-tradable markets
      if (!marketId && !spotStore.activeMarketIds.includes(order.marketId)) {
        return
      }

      switch (order.state) {
        case SpotOrderState.Booked:
        case SpotOrderState.Filled:
        case SpotOrderState.Unfilled:
        case SpotOrderState.PartialFilled: {
          const subaccountOrderHistory = [
            order,
            ...spotStore.subaccountOrderHistory.filter(
              (o) => o.orderHash !== order.orderHash
            )
          ].slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

          spotStore.$patch({
            subaccountOrderHistory,
            subaccountOrderHistoryCount: subaccountOrderHistory.length
          })

          break
        }
        case SpotOrderState.Canceled: {
          if (order.orderHash) {
            const subaccountOrderHistory = spotStore.subaccountOrderHistory
              .map((o) => (o.orderHash === order.orderHash ? order : o))
              .slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

            spotStore.$patch({
              subaccountOrderHistory,
              subaccountOrderHistoryCount: subaccountOrderHistory.length
            })

            break
          }
        }
      }
    }
  })
}

export const streamSubaccountTrades = (marketId?: string) => {
  const spotStore = useSpotStore()

  const { subaccount } = useAccountStore()
  const { isUserWalletConnected } = useWalletStore()

  if (!isUserWalletConnected || !subaccount) {
    return
  }

  grpcStreamSubaccountTrade({
    marketId,
    subaccountId: subaccount.subaccountId,
    callback: ({ trade, operation }) => {
      if (!trade) {
        return
      }

      // filter out non-tradable markets
      if (!marketId && !spotStore.activeMarketIds.includes(trade.marketId)) {
        return
      }

      switch (operation) {
        case StreamOperation.Insert: {
          const subaccountTrades = [trade, ...spotStore.subaccountTrades].slice(
            0,
            TRADE_MAX_SUBACCOUNT_ARRAY_SIZE
          )

          spotStore.$patch({
            subaccountTrades,
            subaccountTradesCount: subaccountTrades.length
          })

          break
        }
        case StreamOperation.Delete: {
          const subaccountTrades = spotStore.subaccountTrades
            .filter((order) => order.orderHash !== trade.orderHash)
            .slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

          spotStore.$patch({
            subaccountTrades,
            subaccountTradesCount: subaccountTrades.length
          })

          break
        }
        case StreamOperation.Update: {
          const subaccountTrades = spotStore.subaccountTrades
            .map((t) => (t.orderHash === trade.orderHash ? trade : t))
            .slice(0, TRADE_MAX_SUBACCOUNT_ARRAY_SIZE)

          spotStore.$patch({
            subaccountTrades,
            subaccountTradesCount: subaccountTrades.length
          })

          break
        }
      }
    }
  })
}
