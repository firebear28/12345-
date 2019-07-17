<template>
  <div class="dashboard-editor-container">

    <github-corner style="position: absolute; top: 0px; border: 0; right: 0;"/>
    <img src="@/assets/timg.jpg" alt="" style="width:100%;height:100%">
  </div>
</template>

<script>
import GithubCorner from '@/components/GithubCorner'

export default {
  name: 'DashboardAdmin',
  components: {
    GithubCorner
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}
</style>
