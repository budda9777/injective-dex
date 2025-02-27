<script lang="ts" setup>
import { PropType } from 'vue'
import { BridgingNetwork } from '@injectivelabs/sdk-ui-ts'
import { Modal, UiMarketWithToken } from '@/types'

const modalStore = useModalStore()
const router = useRouter()

const props = defineProps({
  market: {
    type: Object as PropType<UiMarketWithToken>,
    required: true
  }
})

const isModalOpen = computed(() => modalStore.modals[Modal.MarketDeprecated])
const ticker = computed(() => props.market.ticker)
const symbol = computed(() => props.market.baseToken.symbol)

const network = computed(() => {
  // todo: expand conditions as required
  if (props.market.slug === 'huahua-usdt') {
    return BridgingNetwork.Chihuahua
  }

  return BridgingNetwork.Injective
})

function close() {
  modalStore.closeModal(Modal.MarketDeprecated)
  router.push({ name: 'index' })
}
</script>

<template>
  <AppModal :show="isModalOpen" sm @modal:closed="close">
    <template #title>
      <h3 class="text-base">
        {{ $t('marketDeprecated.title') }}
      </h3>
    </template>

    <div class="relative">
      <i18n-t
        keypath="marketDeprecated.description"
        tag="p"
        class="text-sm mb-3"
      >
        <template #ticker>
          <span class="font-bold">{{ ticker }}</span>
        </template>
      </i18n-t>

      <ul class="list-disc ml-4 text-xs">
        <li>{{ $t('marketDeprecated.subDescriptionOne', { ticker }) }}</li>
        <i18n-t
          keypath="marketDeprecated.subDescriptionTwo"
          tag="li"
          class="mt-2"
        >
          <template #symbol>
            <span class="uppercase">{{ symbol }}</span>
          </template>

          <template #network>
            <span class="capitalize">{{ network }}</span>
          </template>
        </i18n-t>
      </ul>

      <div class="mt-6 flex flex-col gap-4">
        <NuxtLink :to="{ name: 'markets' }" class="">
          <AppButton lg class="w-full text-blue-900 bg-blue-500">
            <span class="font-semibold">
              {{ $t('marketDeprecated.exploreOtherMarkets') }}
            </span>
          </AppButton>
        </NuxtLink>
      </div>
    </div>
  </AppModal>
</template>
