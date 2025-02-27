<script lang="ts" setup>
import { PropType } from 'vue'
import { UiSpotMarketWithToken, ZERO_IN_BASE } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { TradeForm, TradeField } from '@/types'

const props = defineProps({
  isBuy: Boolean,
  isLoading: Boolean,

  amount: {
    type: String,
    default: undefined
  },

  worstPriceWithSlippage: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    required: true
  },

  market: {
    type: Object as PropType<UiSpotMarketWithToken>,
    required: true
  }
})

const { takerFeeRate } = useTradeFee(computed(() => props.market))

const showEmpty = computed(() => {
  return (
    !props.market ||
    props.worstPriceWithSlippage.eq(0) ||
    new BigNumberInBase(props.amount || 0).isNaN()
  )
})

// execution_price * quantity * takerFeeRate * (1 - takerFeeRateDiscount)
const fee = computed<BigNumberInBase>(() => {
  const quantity = new BigNumberInBase(
    props.formValues[TradeField.QuoteAmount] || 0
  )

  if (quantity.isNaN() || quantity.lte(0)) {
    return ZERO_IN_BASE
  }

  return quantity.times(takerFeeRate.value)
})

const { valueToString: feeToFormat } = useBigNumberFormatter(fee, {
  decimalPlaces: props.market.priceDecimals || 3,
  minimalDecimalPlaces: props.market.priceDecimals || 3
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex items-center justify-end gap-2">
      <span>{{ $t('trade.convert.fetching_price') }}</span>
      <AppSpinner sm />
    </div>

    <div class="space-y-3">
      <PartialsConvertSummaryRow :title="`${$t('account.fee')}`">
        <span v-if="showEmpty">&mdash;</span>
        <span v-else>≈ {{ feeToFormat }} {{ market?.quoteToken.symbol }} </span>
      </PartialsConvertSummaryRow>
    </div>
  </div>
</template>
