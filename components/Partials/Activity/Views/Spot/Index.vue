<script lang="ts" setup>
import { PropType } from 'vue'
import { Status, StatusType } from '@injectivelabs/utils'

const spotStore = useSpotStore()
const { success } = useNotifications()
const { $onError } = useNuxtApp()
const { t } = useLang()

const props = defineProps({
  denom: {
    type: String,
    default: ''
  },

  side: {
    type: String,
    default: ''
  },

  status: {
    type: Object as PropType<Status>,
    default: () => new Status()
  }
})

const tabCountElement = document.getElementById(
  'activity-spot-tab-count-default'
)
const actionStatus = reactive(new Status(StatusType.Idle))

const markets = computed(() =>
  spotStore.markets
    .filter((m) => m.baseDenom === props.denom || m.quoteDenom === props.denom)
    .map(({ marketId }) => marketId)
)

const filteredOrders = computed(() =>
  spotStore.subaccountOrders.filter((order) => {
    const orderMatchesDenom =
      markets.value.length === 0 || markets.value.includes(order.marketId)
    const orderMatchesSide = !props.side || props.side === order.orderSide

    return orderMatchesDenom && orderMatchesSide
  })
)

onMounted(() => tabCountElement?.classList.add('hidden'))
onUnmounted(() => tabCountElement?.classList.remove('hidden'))

function handleCancelOrders() {
  actionStatus.setLoading()

  const action =
    filteredOrders.value.length === 1
      ? spotStore.cancelOrder(filteredOrders.value[0])
      : spotStore.batchCancelOrder(filteredOrders.value)

  action
    .then(() => {
      success({
        title: t('trade.orders_cancelled')
      })
    })
    .catch($onError)
    .finally(() => {
      actionStatus.setIdle()
    })
}
</script>

<template>
  <div>
    <Teleport to="#activity-spot-tab-count">
      <span>({{ filteredOrders.length }})</span>
    </Teleport>

    <Teleport to="#activity-toolbar-action">
      <AppButton
        v-if="filteredOrders.length > 0"
        class="text-red-500 bg-red-500 bg-opacity-10 font-semibold hover:text-white"
        :status="actionStatus"
        data-cy="activity-cancel-all-button"
        @click="handleCancelOrders"
      >
        <span class="whitespace-nowrap">
          {{ $t('trade.cancelAllOrders') }}
        </span>
      </AppButton>
    </Teleport>

    <AppHocLoading
      class="h-full"
      :status="status"
      :loader-class="status.isLoading() ? 'relative' : ''"
    >
      <div class="w-full h-full">
        <!-- mobile table -->
        <CommonTableBody
          :show-empty="filteredOrders.length === 0"
          class="sm:hidden mt-3 max-h-lg overflow-y-auto"
        >
          <PartialsCommonSubaccountOrderMobile
            v-for="(order, index) in filteredOrders"
            :key="`mobile-spot-orders-${index}-${order.orderHash}`"
            class="col-span-1"
            :is-spot="true"
            :order="order"
          />

          <template #empty>
            <CommonEmptyList
              :message="$t('trade.emptyOrders')"
              class="pb-4 grow bg-gray-900"
            />
          </template>
        </CommonTableBody>

        <CommonTableWrapper break-md class="hidden sm:block">
          <table v-if="filteredOrders.length > 0" class="table">
            <PartialsCommonSubaccountOrderHeader />
            <tbody>
              <PartialsCommonSubaccountOrderRow
                v-for="(order, index) in filteredOrders"
                :key="`orders-${index}-${order.orderHash}`"
                :order="order"
                is-spot
              />
            </tbody>
          </table>

          <CommonEmptyList
            v-else
            :message="$t('trade.emptyOrders')"
            data-cy="universal-table-nothing-found"
            class="pb-4 grow"
          />
        </CommonTableWrapper>
      </div>
    </AppHocLoading>
  </div>
</template>
