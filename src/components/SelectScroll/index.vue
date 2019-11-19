<template>
  <div 
    :idName="idName"
    :name="name"
    :url="url"
    :rows="rows"
    :objkey="objkey"
    :objname="objname"
    :total="total"
    :emit="emit">
    <el-form-item :label="idName">
      <el-select
        ref="select"
        v-model="serviceId"
        placeholder="请选择"
        clearable
        filterable
        @change="change"
        style="width: 100%"
      >
        <el-option
          v-for="item in serviceList"
          :key="item[objkey]"
          :label="item[objkey]"
          :value="item[objkey]"
        />
      </el-select>
    </el-form-item>
    <el-form-item :label="name">
      <span>{{ serviceName }}</span>
    </el-form-item>
  </div>
</template>

<script>
import { obj2formdatastr } from '@/utils/utils.js'
import { request } from '@/utils/req.js'

export default {
  props: {
    idName: "",
    name: "",
    url: "", // eslint-disable-line
    rows: '',
    total: '',
    objkey: '',
    objname: '',
    emit: ''
  },
  data() {
    return {
      serviceList: [],
      serviceId: '',
      serviceName: '',
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
        }
      });
    },
    change(v) {
      if(v === '') return this.serviceName = ''
      for( var i of this.serviceList){
        if(i[this.objkey] === v){
          this.serviceName = i[this.objname]
          let obj = {}
          obj[this.objkey] = v
          obj[this.objname] = this.serviceName
          this.$emit(this.emit, obj)
        }
      }
      // setTimeout(_ => this.serviceId = '', 1500);
    },
    // 下拉到底部的时候，触发的函数，会自动加载数据
    loadData (e) {
        // 如果没有更多了，那么则不执行
    //     if (this.list.nomore) return

      const el = e.target

      // 如果已经滚到底部了
      if (el.scrollHeight - el.clientHeight - el.scrollTop < 5) {
        if(this.totalElements > this.page * this.size)
          this.getList()
          // 如果loadingmore为true，说明正在请求，这时候不重复进行。而要等loadingmore为false时空闲状态才允许请求.
          // if (this.list.loadingmore === false) {
          //   // 增加页码，然后重新请求数据
          //   this.$store.dispatch('List/page')
          //   // 滚动到loading处，让用户知道我在加载中...
          //   this.list.loadingmore && this.$nextTick(() => el.scrollTo(0, el.scrollHeight + 20))
          // }
      }
    },
    clear() {
      this.serviceId = ''
      this.serviceName = ''
    }
  },
  created() {
    this.getList()
  },
  mounted() {
    // 懒加载优化：滚动节流策略
    let __SCROLLTIMER__ = null
    // 绑定滚动事件
    $('.el-scrollbar__wrap').scroll(e => {
        clearTimeout(__SCROLLTIMER__);
        __SCROLLTIMER__ = setTimeout(_ => this.loadData(e), 150);
    })
  }
};
</script>

<style scoped>
</style>
