<template>
  <div class="app-container">
    <div v-if="list" class="text">
      <div class="items">
        <p class="list">head堆 最大(上限)(M)：</p><p class="list">{{ list['headMemoryMax'] }}</p>
      </div>
      <div class="items">
        <p class="list">head堆 当前(已使用)(M)：</p><p class="list">{{ list['headMemoryUsed'] }}</p>
      </div>
      <div class="items">
        <p class="list">head堆 使用率：</p><p class="list">{{ list['headMemoryUseRate'] }}</p>
      </div>
      <div class="items">
        <p class="list">仍活动的线程总数：</p><p class="list">{{ list['threadCount'] }}</p>
      </div>
      <div class="items">
        <p class="list">峰值：</p><p class="list">{{ list['peakThreadCount'] }}</p>
      </div>
      <div class="items">
        <p class="list">系统cpu负载：</p><p class="list">{{ list['systemCpuLoad'] }}</p>
      </div>
    </div>

  </div>
</template>

<script>
import { fetchPv, createArticle, updateArticle } from '@/api/article'
import waves from '@/directive/waves' // Waves directive
import { request } from '@/utils/req.js'

export default {
  name: 'ComplexTable',
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        id: '',
        page: 1,
        limit: 10,
        importance: undefined,
        title: undefined,
        type: undefined,
        state: '',
        sort: '+id'
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      request('/sg/base/resourceInfo/getResourceInfo').then(data => {
        this.list = data
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.items{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .list {
    width: 300px;
    margin-left: 20px;
  }
}
</style>

