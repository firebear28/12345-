<template>
    <el-select
      ref="select"
      v-model="serviceId"
      placeholder="请选择"
      clearable
      filterable
      :filter-method="filter"
      :loading="loading"
      @change="change"
      @clear="clear"
      style="width: 100%"
      :url="url"
      :rows="rows"
      :objkey="objkey"
      :objname="objname"
      :total="total"
      :emit="emit"
    >
      <el-option
        v-for="(item,i) in options"
        :key="i"
        :label="item[objkey]"
        :value="item[objkey]"
      />
    </el-select>
</template>

<script>
import { obj2formdatastr } from '@/utils/utils.js'
import { request } from '@/utils/req.js'

export default {
  props: {
    url: "",          // eslint-disable-line
    rows: '',         // 内容的key
    total: '',        // 页数的key
    objkey: '',       // options中对象的key
    objname: '',      // options中对象的name
    emit: '',         // 传给父组件的方法名
  },
  data() {
    return {
      options: [],
      optionBack: [],
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
  },
  watch: {
  },
  methods: {
    // 搜索的逻辑
    filter(v) {
        const $options = JSON.parse(JSON.stringify(this.optionBack))
        const filter = $options.filter(i=>~String(i.account).indexOf(v))
        const length = filter.length
        // 当清空选中值时，清空
        console.log(filter,v === '')
        if(v === '') return this.options = $options
        // if(!length){
        //     let __SCROLLTIMER__ = null
        //     clearTimeout(__SCROLLTIMER__);
        //     __SCROLLTIMER__ = setTimeout(_ => {
        //       this.page = -1
        //       this.getList(v, 'eq_account')
        //     }, 500);
        // }else{
          this.options = [{account: "y13609666521",fullname: "刘翥远"},{account: "y13609666521",fullname: "刘翥远"},{account: "y13609666521",fullname: "刘翥远"}]
        // }
        // 给父组件传值
        // this.$emit(this.emit, v)
    },
    change(v) {
      // 当清空选中值时，清空
      if(v === '') this.serviceName = ''
      // 当存在第二对不可修改的对应的参数时
      if(this.objname){
        let obj = {}
        obj[this.objkey] = ''
        obj[this.objname] = ''
        for( var i of this.options){
          // 如果有相对应的值
          if(i[this.objkey] === v){
            obj[this.objkey] = v
            obj[this.objname] = i[this.objname]
          }
        }
        // 给父组件传值————对象
        this.$emit(this.emit, obj)
      }else{
        // 给父组件传值
        this.$emit(this.emit, v)
      }
    },
    // 获取服务注册列表
    getList(query, key) {
      this.loading = true
      let params = obj2formdatastr({
        page: this.page += 1,
        size: this.size
      });
      if(query) params = params+'&'+key+'='+query
      console.log(params)
      request(this.url + params).then(data => {
        this.loading = false
        if(this.maybe(_=>data[this.rows].length, false)){
          this.totalElements = data[this.total]
          for( var i of data[this.rows]){
            this.options.push(i);
          }
          this.optionBack = this.options
        }
      });
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
