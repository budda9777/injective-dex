<script lang="ts" setup>
import { formatWalletAddress } from '@injectivelabs/utils'
import { ROUTES } from '@/app/utils/constants'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const formattedInjectiveAddress = computed(() =>
  formatWalletAddress(walletStore.injectiveAddress)
)

function handleDisconnect() {
  walletStore.logout()

  if (ROUTES.walletConnectedRequiredRouteNames.includes(route.name as string)) {
    router.push({ name: 'index' })
  }
}
</script>

<template>
  <div class="flex items-center">
    <BaseHoverMenu
      popper-class="min-w-[310px] sm:min-w-[356px] bg-gray-850 shadow-dropdown rounded-lg"
    >
      <template #default>
        <div
          class="font-medium text-sm cursor-pointer flex items-center justify-center lg:justify-start w-10 h-10 lg:w-auto lg:px-6 rounded-lg"
        >
          <BaseIcon name="user" class="w-4 h-4 lg:mr-2" />
          <span class="hidden lg:block font-mono">
            {{ formattedInjectiveAddress }}
          </span>
        </div>
      </template>

      <template #content>
        <div class="flex flex-col gap-4 rounded-lg p-4 bg-gray-850">
          <div class="rounded-lg bg-gray-1000">
            <div class="flex flex-col py-3 px-4">
              <div class="flex justify-between pb-2">
                <span class="text-sm font-semibold text-gray-200">
                  {{ $t('navigation.myAccount') }}
                </span>
                <span
                  class="text-blue-500 hover:text-opacity-80 cursor-pointer text-xs font-medium"
                  @click="handleDisconnect"
                >
                  {{ $t('navigation.disconnect') }}
                </span>
              </div>
              <LayoutWalletDetailsConnectedWallet
                :wallet="walletStore.wallet"
              />
            </div>
          </div>
        </div>
      </template>
    </BaseHoverMenu>
  </div>
</template>
