<script lang="ts" setup>
import { Status, StatusType } from '@injectivelabs/utils'
import { BusEvents, Modal, WalletConnectStatus, WalletModalType } from '@/types'
import { GEO_IP_RESTRICTIONS_ENABLED } from '@/app/utils/constants'
import { amplitudeTracker } from '@/app/providers/AmplitudeTracker'

const modalStore = useModalStore()
const walletStore = useWalletStore()

const status: Status = reactive(new Status(StatusType.Loading))
const walletModalType = ref<WalletModalType>(WalletModalType.All)

const isModalOpen = computed<boolean>(
  () => modalStore.modals[Modal.Connect] && !walletStore.isUserWalletConnected
)

const showLoading = computed<boolean>(
  () => walletStore.walletConnectStatus === WalletConnectStatus.connecting
)

onMounted(() => {
  useEventBus<string>(BusEvents.ShowLedgerConnect).on(handleLedgerConnect)

  Promise.all([walletStore.isMetamaskInstalled()]).finally(() =>
    status.setIdle()
  )
})

function handleLedgerConnect() {
  walletModalType.value = WalletModalType.Ledger

  modalStore.openModal({ type: Modal.Connect })
}

function handleWalletConnect() {
  amplitudeTracker.submitWalletConnectClickedTrackEvent()

  if (GEO_IP_RESTRICTIONS_ENABLED) {
    modalStore.openModal({ type: Modal.Terms })
  } else {
    modalStore.openModal({ type: Modal.Connect })
  }
}

function handleModalClose() {
  modalStore.closeModal(Modal.Connect)
}

function updateWalletModalType(type: WalletModalType) {
  walletModalType.value = type
}

watch(
  () => walletStore.walletConnectStatus,
  (newWalletConnectStatus) => {
    if (newWalletConnectStatus === WalletConnectStatus.connected) {
      modalStore.closeModal(Modal.Connect)
      modalStore.openPersistedModalIfExist()
    }
  }
)

watch(isModalOpen, (newShowModalState) => {
  if (!newShowModalState) {
    handleModalClose()
    walletModalType.value = WalletModalType.All
  }
})
</script>

<template>
  <div v-if="walletStore.isUserWalletConnected">
    <LayoutWalletDetails />
  </div>

  <AppButton
    v-else
    class="bg-blue-500 text-blue-900 font-semibold whitespace-nowrap"
    @click="handleWalletConnect"
  >
    {{ $t('connect.connectWallet') }}
  </AppButton>

  <AppModal
    :show="isModalOpen"
    :show-loading="showLoading"
    :ignore="['.v-popper__popper']"
    md
    @modal:closed="handleModalClose"
  >
    <template #title>
      <h3 v-if="walletModalType === WalletModalType.Trezor">
        {{ $t('connect.connectUsingTrezor') }}
      </h3>
      <h3 v-else-if="walletModalType === WalletModalType.Ledger">
        {{ $t('connect.connectUsingLedger') }}
      </h3>
      <h3 v-else>
        {{ $t('connect.connectToWallet') }}
      </h3>
    </template>

    <LayoutWalletLedger v-if="walletModalType === WalletModalType.Ledger" />
    <LayoutWalletTrezor
      v-else-if="walletModalType === WalletModalType.Trezor"
    />
    <ul
      v-else
      class="divide-y divide-gray-800 border-gray-700 rounded-lg overflow-hidden"
    >
      <LayoutWalletConnectWalletMetamask />
      <LayoutWalletConnectWalletKeplr />
      <LayoutWalletConnectWalletCosmostation />
      <LayoutWalletConnectWalletLeap />
      <LayoutWalletConnectWalletTorus />
      <LayoutWalletConnectWalletLedger @click="updateWalletModalType" />
      <LayoutWalletConnectWalletTrezor @click="updateWalletModalType" />
    </ul>
  </AppModal>
  <ModalsTerms />
</template>
