import { AccountPortfolio } from '@injectivelabs/subaccount-consumer'
import { SubaccountTransformer } from '@injectivelabs/ui-common'
import {
  UiSubaccount,
  UiSubaccountBalance
} from '@injectivelabs/ui-common/dist/subaccount/types'
import {
  SubaccountBalanceWithTokenMetaData,
  Token
} from '@injectivelabs/ui-common/dist/token/types'
import { BigNumberInBase } from '@injectivelabs/utils'
import { actionTree, getterTree } from 'typed-vuex'
import {
  subaccountActionServiceFactory,
  subaccountService,
  tokenService
} from '~/app/services'
import {
  streamSubaccountBalances,
  cancelSubaccountStreams
} from '~/app/services/account'
import { backupPromiseCall } from '~/app/utils/async'
import { ZERO_TO_STRING } from '~/app/utils/constants'

const initialStateFactory = () => ({
  subaccountIds: [] as string[],
  subaccount: undefined as UiSubaccount | undefined,
  subaccountBalancesWithTokenMetaData: [] as SubaccountBalanceWithTokenMetaData[],
  accountPortfolio: undefined as AccountPortfolio | undefined
})

const initialState = initialStateFactory()

export const state = () => ({
  subaccountIds: initialState.subaccountIds as string[],
  subaccount: initialState.subaccount as UiSubaccount | undefined,
  subaccountBalancesWithTokenMetaData: initialState.subaccountBalancesWithTokenMetaData as SubaccountBalanceWithTokenMetaData[],
  accountPortfolio: initialState.accountPortfolio as
    | AccountPortfolio
    | undefined
})

export type AccountStoreState = ReturnType<typeof state>

export const getters = getterTree(state, {
  //
})

export const mutations = {
  setSubacccountIds(state: AccountStoreState, subaccountIds: string[]) {
    state.subaccountIds = subaccountIds
  },

  setSubaccount(state: AccountStoreState, subaccount: UiSubaccount) {
    state.subaccount = subaccount
  },

  setPortfolioValue(
    state: AccountStoreState,
    accountPortfolio: AccountPortfolio
  ) {
    state.accountPortfolio = accountPortfolio
  },

  setSubaccountBalance(state: AccountStoreState, balance: UiSubaccountBalance) {
    if (!state.subaccount) {
      return
    }

    const currentBalance = [...state.subaccount.balances].find(
      (b) => b.denom === balance.denom
    )
    const balances = [...state.subaccount.balances].filter(
      (b) => b.denom !== balance.denom
    )
    const updatedBalance = {
      ...balance,
      totalBalance:
        balance.totalBalance ||
        (currentBalance ? currentBalance.totalBalance : ZERO_TO_STRING),
      availableBalance:
        balance.availableBalance ||
        (currentBalance ? currentBalance.availableBalance : ZERO_TO_STRING)
    }

    state.subaccount = {
      ...state.subaccount,
      balances: [...balances, updatedBalance]
    }
  },

  setSubaccountBalancesWithTokenMetaData(
    state: AccountStoreState,
    subaccountBalancesWithTokenMetaData: SubaccountBalanceWithTokenMetaData[]
  ) {
    state.subaccountBalancesWithTokenMetaData = subaccountBalancesWithTokenMetaData
  },

  reset(state: AccountStoreState) {
    const initialState = initialStateFactory()

    state.subaccount = initialState.subaccount
    state.subaccountIds = initialState.subaccountIds
    state.subaccountBalancesWithTokenMetaData =
      initialState.subaccountBalancesWithTokenMetaData
  }
}

export const actions = actionTree(
  { state, mutations },
  {
    async init(_) {
      await this.app.$accessor.account.fetchSubaccounts()
    },

    async fetchSubaccounts({ commit }) {
      const { injectiveAddress } = this.app.$accessor.wallet

      if (!injectiveAddress) {
        return
      }

      const subaccountIds = await subaccountService.fetchSubaccounts(
        injectiveAddress
      )

      if (subaccountIds.length === 0) {
        return
      }

      const [subaccountId] = subaccountIds

      commit('setSubacccountIds', subaccountIds)
      commit(
        'setSubaccount',
        await subaccountService.fetchSubaccount(subaccountId)
      )

      if (this.app.context.route.name === 'spot-spot') {
        await this.app.$accessor.spot.fetchSubaccountMarketTrades()
        await this.app.$accessor.spot.fetchSubaccountOrders()
        await this.app.$accessor.spot.fetchSubaccountTrades()
        await this.app.$accessor.spot.streamSubaccountOrders()
        await this.app.$accessor.spot.streamSubaccountTrades()
      }

      if (this.app.context.route.name === 'derivatives-derivative') {
        await this.app.$accessor.derivatives.fetchSubaccountMarketTrades()
        await this.app.$accessor.derivatives.fetchSubaccountOrders()
        await this.app.$accessor.derivatives.fetchSubaccountTrades()
        await this.app.$accessor.derivatives.fetchSubaccountPosition()
        await this.app.$accessor.derivatives.streamSubaccountOrders()
        await this.app.$accessor.derivatives.streamSubaccountPositions()
        await this.app.$accessor.derivatives.streamSubaccountTrades()
      }
    },

    async fetchSubaccountsBalances({ commit, state }) {
      if (state.subaccount && state.subaccount.balances) {
        const subaccountBalances = state.subaccount.balances
        const subaccountBalancesWithTokenMeta = await tokenService.getSubaccountBalancesWithTokenMeta(
          subaccountBalances
        )

        commit(
          'setSubaccountBalancesWithTokenMetaData',
          subaccountBalancesWithTokenMeta
        )
      }
    },

    async updateSubaccount({ commit, state }) {
      const { subaccount } = state
      const { injectiveAddress } = this.app.$accessor.wallet

      if (!subaccount || !injectiveAddress) {
        return
      }

      const { subaccountId } = subaccount

      commit(
        'setSubaccount',
        await subaccountService.fetchSubaccount(subaccountId)
      )
    },

    async fetchAccountPortfolio({ commit, state }) {
      const { subaccount } = state
      const { injectiveAddress } = this.app.$accessor.wallet

      if (!injectiveAddress) {
        return
      }

      if (!subaccount) {
        await this.app.$accessor.account.init()
      }

      commit(
        'setPortfolioValue',
        await subaccountService.fetchAccountPortfolio(injectiveAddress)
      )
    },

    streamSubaccountBalances({ commit, state }) {
      const { subaccount } = state

      if (!subaccount) {
        return
      }

      streamSubaccountBalances({
        subaccountId: subaccount.subaccountId,
        callback: ({ balance }) => {
          if (!balance) {
            return
          }

          commit(
            'setSubaccountBalance',
            SubaccountTransformer.subaccountBalanceToUiSubaccountBalance(
              balance
            )
          )
        }
      })
    },

    async deposit(
      { state },
      { amount, token }: { amount: BigNumberInBase; token: Token }
    ) {
      const { subaccount } = state
      const {
        address,
        injectiveAddress,
        isUserWalletConnected
      } = this.app.$accessor.wallet
      const subaccountActionService = subaccountActionServiceFactory()

      if (!subaccount || !isUserWalletConnected) {
        return
      }

      await this.app.$accessor.app.queue()
      await this.app.$accessor.wallet.validate()

      await subaccountActionService.deposit({
        address,
        injectiveAddress,
        denom: token.denom,
        subaccountId: subaccount.subaccountId,
        amount: amount.toWei(token.decimals).toFixed(0)
      })

      await backupPromiseCall(() => this.app.$accessor.bank.fetchBalances())
      await backupPromiseCall(() =>
        this.app.$accessor.account.updateSubaccount()
      )
    },

    async withdraw(
      { state },
      { amount, token }: { amount: BigNumberInBase; token: Token }
    ) {
      const { subaccount } = state
      const {
        address,
        injectiveAddress,
        isUserWalletConnected
      } = this.app.$accessor.wallet
      const subaccountActionService = subaccountActionServiceFactory()

      if (!subaccount || !isUserWalletConnected) {
        return
      }

      await this.app.$accessor.app.queue()
      await this.app.$accessor.wallet.validate()

      await subaccountActionService.withdraw({
        address,
        injectiveAddress,
        denom: token.denom,
        subaccountId: subaccount.subaccountId,
        amount: amount.toWei(token.decimals).toFixed(0)
      })

      await backupPromiseCall(() => this.app.$accessor.bank.fetchBalances())
      await backupPromiseCall(() =>
        this.app.$accessor.account.updateSubaccount()
      )
    },

    async reset({ commit }) {
      await cancelSubaccountStreams()
      commit('reset')
    }
  }
)
