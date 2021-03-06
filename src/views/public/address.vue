<template>
  <div class="app-container">
    <div class="filter-container">
      <!-- ID查询：
      <el-input v-model="listQuery.id" placeholder="请输入订单编号" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      名称：
      <el-select v-model="listQuery.state" placeholder="请选择名称" clearable class="filter-item" style="width: 130px" @change="getList">
        <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.label" :value="item.key"/>
      </el-select>
      当前专题：
      <el-select v-model="listQuery.type" placeholder="请选择专题" clearable style="width: 140px" class="filter-item" @change="changeTopics">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button> -->
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">新增</el-button>
      <!-- <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">导出</el-button> -->
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange">
      <el-table-column :index="indexMethod" type="index" label="序号" sortable="custom" align="center" width="75"/>
      <el-table-column label="主键" prop="bid" min-width="200"/>
      <el-table-column label="网站地址" prop="address" min-width="300"/>
      <el-table-column label="网站名称" prop="webName" min-width="300"/>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" @click="handleModifyStatus(scope.row,'deleted')">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px">
        <el-form-item v-if="dialogStatus !== 'create'" label="主键" prop="bid">
          <el-input v-model="temp.bid"/>
        </el-form-item>
        <el-form-item label="网站地址" prop="address">
          <el-input v-model="temp.address"/>
        </el-form-item>
        <el-form-item label="网站名称" prop="webName">
          <el-input v-model="temp.webName"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">提交</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel"/>
        <el-table-column prop="pv" label="Pv"/>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">{{ $t('table.confirm') }}</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { fetchList, fetchPv, createArticle, updateArticle } from '@/api/article'
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import { request, post, put, reqDelete } from '@/utils/req.js'
import { obj2formdatastr } from '@/utils/utils.js'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

const calendarTypeOptions = [
  { key: '10', label: '可用初始训练数据' },
  { key: '11', label: '人工校准' },
  { key: '12', label: '识率很高数据' },
  { key: '13', label: '临时标志中间处理数据' }
]

const sortOptions = [
  { key: 'city', label: '城市管理' },
  { key: 'admn', label: '行政效能' },
  { key: 'envr', label: '环境保护' },
  { key: 'depa', label: '部门管理' },
  { key: 'account', label: '账号管理' },
  { key: 'street', label: '镇街管理' },
  { key: 'service', label: '集中日志管理' },
  { key: 'matter', label: '事项管理' },
  { key: 'public', label: '舆情分析配置' }
]

// arr to obj ,such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
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
      },
      calendarTypeOptions,
      sortOptions,
      statusOptions: ['published', 'draft', 'deleted'],
      temp: {
        bid: '',
        keyword: '',
        type: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        bid: [{ required: true, message: 'type is required', trigger: 'change' }],
        address: [{ required: true, message: 'type is required', trigger: 'change' }],
        webName: [{ required: true, message: 'type is required', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      const params = obj2formdatastr({
        page: this.listQuery.page - 1,
        size: this.listQuery.limit
      })
      request('/sg/item/sgSentimentAddress/findByPage?' + params).then(data => {
        this.list = data.content
        this.total = data.totalElements

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    indexMethod(index) {
      return (index + 1) + 10 * (this.listQuery.page - 1)
    },
    changeTopics() {
      // 路由跳转
      this.$router.push({ path: '/' + this.listQuery.type + '/index' })
    },
    handleFilter() {
      request('/sg/item/sgSentimentAddress/' + this.listQuery.id).then(data => {
        if (data.length != 0) {
          this.list = []
          this.list.push(data)
          this.listQuery.page = 1
          this.total = 1
        } else {
          this.list = []
          this.listQuery.page = 1
          this.total = 0
        }
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    handleModifyStatus(row, status) {
      this.$confirm('此操作将永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
      return reqDelete('/sg/item/sgSentimentAddress/' + row.bid).then(data => {
        this.$notify({
          title: '成功',
          message: '删除成功',
          type: 'success',
          duration: 2000
        })
        const index = this.list.indexOf(row)
        this.list.splice(index, 1)
      })
      // row.status = status
      })
    },
    sortChange(data) {
    //   const { prop, order } = data
    //   if (prop === 'id') {
    //     this.sortByID(order)
    //   }
    },
    // sortByID(order) {
    //   if (order === 'ascending') {
    //     this.listQuery.sort = '+id'
    //   } else {
    //     this.listQuery.sort = '-id'
    //   }
    //   this.handleFilter()
    // },
    resetTemp() {
      this.temp = {
        bid: '',
        address: '',
        webName: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      // return console.log(this.temp)
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const params = {
            bid: '',
            address: this.temp.address,
            webName: this.temp.webName,
          }
          post('/sg/item/sgSentimentAddress/', params).then(data => {
            if (data.code === 200) {
              this.getList()
              this.$message.success('创建成功！')
              this.dialogFormVisible = false
            }
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      // return console.log(this.temp)
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const params = {
            bid: this.temp.bid,
            address: this.temp.address,
            webName: this.temp.webName,
          }
          post('/sg/item/sgSentimentAddress/', params).then(data => {
            if (data.code === 200) {
              this.getList()
              this.$message.success('修改成功！')
              this.dialogFormVisible = false
            }
          })
        }
      })
    },
    handleDelete(row) {
      request('/sg/item/sgSentimentAddress/' + row.bid).then(data => {
        this.$notify({
          title: '成功',
          message: '删除成功',
          type: 'success',
          duration: 2000
        })
        const index = this.list.indexOf(row)
        console.log(index)
        this.list.splice(index, 1)
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      const params = obj2formdatastr({
        page: this.listQuery.page - 1,
        size: this.listQuery.limit
      })
      window.location.href = 'http://19.104.40.37:8082/api/sg/item/sgSentimentAddress/export?' + params
      request('/sg/item/sgSentimentAddress/export?' + params).then(data => {
        this.downloadLoading = false
      })
    },
    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    }
  }
}
</script>
<style lang="scss" scoped>
.filter-item{
  margin-right: 20px;
}
</style>

