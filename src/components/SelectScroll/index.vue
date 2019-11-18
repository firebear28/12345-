<template>
  <el-select
    v-model="serviceId"
    placeholder="请选择"
    clearable
    @change="getList"
    v-infinite-scroll="load"
    :infinite-scroll-distance="50"
    :url="url"
    :rows="rows"
    :id="id"
    :total="total"
    style="width: 100%"
  >
    <!-- <el-option
      v-for="item in serviceList"
      :key="item[id]"
      :label="item[id]"
      :value="item[id]"
    /> -->
    <el-option
      v-for="i in count"
      :key="i"
      :label="i"
      :value="i"
    />
  </el-select>
</template>

<script>
import { obj2formdatastr } from '@/utils/utils.js'
import { request } from '@/utils/req.js'

export default {
  props: {
    url: "", // eslint-disable-line
    rows: '',
    total: '',
    id: ''
  },
  data() {
    return {
      serviceList: [],
      serviceId: '',
      page: -1,
      size: 10,
      totalElements: 0,
      loading: false,
      count: 10
    };
  },
  computed: {
    disabled () {
      return this.loading
    }
  },
  methods: {
    // 获取服务注册列表
    getList() {
      this.loading = false
      const params = obj2formdatastr({
        // serviceName: "",
        page: this.page += 1,
        size: this.size
      });
      request(this.url + params).then(data => {
        this.loading = true
        if(this.maybe(_=>data[this.rows].length, false)){
          this.totalElements = data[this.total]
          for( var i of data[this.rows]){
            this.serviceList.push(i);
          }
          console.log(this.serviceList);
        }
      });
    },
    load() {
          console.log(22222 );
          this.count += 2
      // this.page += 1
      // if(this.totalElements > this.page * this.size)
      //   this.getList()
    },
  },
  created() {
    this.getList()
  }
};
</script>

<style scoped>
</style>
