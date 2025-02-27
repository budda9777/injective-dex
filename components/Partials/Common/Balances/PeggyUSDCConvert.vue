<script lang="ts" setup>
import { PropType } from 'vue'
import { UiSubaccountBalance } from '@injectivelabs/sdk-ui-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { Modal, UiMarketWithToken } from '@/types'
import { usdcTokenDenom } from '@/app/data/token'

const accountStore = useAccountStore()
const bankStore = useBankStore()
const modalStore = useModalStore()

const props = defineProps({
  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  }
})

const hasUsdcPeggyBalance = computed(() => {
  if (
    usdcTokenDenom.USDCet.toLowerCase() !==
    props.market.quoteDenom.toLowerCase()
  ) {
    return false
  }

  const peggyUsdcBankBalance = bankStore.bankBalancesWithToken.find(
    (balance) =>
      usdcTokenDenom.USDC.toLowerCase() === balance.token.denom.toLowerCase()
  )
  const peggyUsdcSubaccountBalance = accountStore.subaccount?.balances.find(
    (balance: UiSubaccountBalance) =>
      usdcTokenDenom.USDC.toLowerCase() === balance.denom.toLowerCase()
  )

  return new BigNumberInBase(peggyUsdcBankBalance?.balance || 0)
    .plus(peggyUsdcSubaccountBalance?.totalBalance || 0)
    .gt(0)
})

onMounted(() => {
  nextTick(() => {
    if (hasUsdcPeggyBalance.value) {
      openModal()
    }
  })
})

function openModal() {
  modalStore.openModal({ type: Modal.USDCDetected })
}
</script>

<template>
  <div v-if="hasUsdcPeggyBalance" class="cursor-pointer" @click="openModal">
    <span class="text-blue-500 font-semibold">{{
      $t('trade.convert.convert')
    }}</span>
  </div>

  <ModalsPeggyUsdcDetected :market="market" />
</template>
