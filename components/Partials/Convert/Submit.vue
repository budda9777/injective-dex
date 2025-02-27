<script lang="ts" setup>
import { PropType } from 'vue'
import { UiSpotMarketWithToken } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase, Status } from '@injectivelabs/utils'
import { Modal, TradeForm } from '@/types'
import { tradeErrorMessages } from '@/app/client/utils/validation/trade'

const modalStore = useModalStore()
const router = useRouter()
const bankStore = useBankStore()
const walletStore = useWalletStore()

const props = defineProps({
  isBuy: Boolean,
  hasFormErrors: Boolean,

  amount: {
    type: String,
    default: ''
  },

  errors: {
    type: Object as PropType<Record<string, string | undefined>>,
    default: () => ({})
  },

  formValues: {
    type: Object as PropType<TradeForm>,
    required: true
  },

  executionPrice: {
    type: Object as PropType<BigNumberInBase>,
    required: true
  },

  market: {
    type: Object as PropType<UiSpotMarketWithToken>,
    required: true
  },

  status: {
    type: Object as PropType<Status>,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'form:submit'): void
}>()

const { insufficientLiquidity, highDeviation } = useSpotError({
  executionPrice: computed(() => props.executionPrice),
  formValues: computed(() => props.formValues),
  isBuy: computed(() => props.isBuy),
  market: computed(() => props.market)
})

const isSubmitDisabled = computed<boolean>(() => {
  return (
    props.hasFormErrors ||
    props.amount === '' ||
    !bankStore.hasEnoughInjForGas ||
    insufficientLiquidity.value
  )
})

const hasInsufficientBalance = computed(() =>
  Object.values(props.errors).includes(tradeErrorMessages.insufficientBalance())
)

function handleConnect() {
  modalStore.openModal({ type: Modal.Connect })
}

function submit() {
  emit('form:submit')
}

function handleNavigation() {
  if (modalStore.modals[Modal.ConvertUsdc]) {
    modalStore.closeModal(Modal.ConvertUsdc)
  }

  router.push({ name: 'account' })
}
</script>

<template>
  <div class="w-full">
    <AppButton
      v-if="!walletStore.isUserWalletConnected"
      lg
      class="w-full bg-blue-500 text-blue-900 font-semibold"
      @click="handleConnect"
    >
      {{ $t('trade.convert.connect_wallet') }}
    </AppButton>

    <AppButton
      v-else
      class="w-full bg-blue-500 text-blue-900 font-semibold"
      lg
      :disabled="isSubmitDisabled"
      :status="status"
      @click="submit"
    >
      <div class="max-auto w-full">
        <span v-if="!bankStore.hasEnoughInjForGas">
          {{ $t('insufficientGas.insufficientGas') }}
        </span>
        <span v-else-if="insufficientLiquidity">
          {{ $t('trade.convert.insufficient_liquidity') }}
        </span>
        <span v-else>{{ $t('trade.convert.convert') }}</span>
      </div>
    </AppButton>

    <p v-if="highDeviation" class="text-red-500 text-sm mt-4">
      {{ $t('trade.execution_price_far_away_from_last_traded_price') }}
    </p>

    <p v-if="hasInsufficientBalance" class="text-red-500 text-sm mt-4">
      <span class="mr-1">
        {{
          $t('trade.convert.insufficient_balance_verbose', {
            symbol: isBuy ? market?.quoteToken.symbol : market?.baseToken.symbol
          })
        }}
      </span>
      <span class="text-blue-600" @click="handleNavigation">
        {{ $t('trade.convert.goToAccount') }}
      </span>
    </p>
  </div>
</template>
