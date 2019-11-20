<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>服务名称：</span>
        <el-input v-model="listQuery.serviceName" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>模块：</span>
        <el-input v-model="listQuery.module" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">新增</el-button>
        <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">导出</el-button>
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;">
      <el-table-column :index="indexMethod" type="index" label="序号" sortable="custom" align="center" width="75"/>
      <el-table-column label="服务名称" prop="serviceName" width="200"/>
      <el-table-column label="模块" prop="module" width="100"/>
      <el-table-column label="请求路径" prop="serviceUrl" min-width="200"/>
      <el-table-column label="请求方法" prop="method" align="center" width="100"/>
      <el-table-column label="入参" prop="accessParams" width="250"/>
      <el-table-column label="返参" prop="returnParams" width="250"/>
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <!-- <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button> -->
          <el-button size="mini" type="danger" @click="handleModifyStatus(scope.row,'deleted')">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="160px">
        <el-form-item label="所属模块" prop="module">
          <el-input v-model="temp.module"/>
        </el-form-item>
        <el-form-item label="服务名称" prop="serviceName">
          <el-input v-model="temp.serviceName"/>
        </el-form-item>
        <el-form-item label="接口地址" prop="serviceUrl">
          <el-input v-model="temp.serviceUrl"/>
        </el-form-item>
        <el-form-item label="请求方法(GET/POST)" prop="method">
          <el-select v-model="temp.method" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in sortOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="接入参数" prop="accessParams">
          <el-input v-model="temp.accessParams"/>
        </el-form-item>
        <el-form-item label="返回参数" prop="returnParams">
          <el-input v-model="temp.returnParams"/>
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
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import { request, post, put, reqDelete } from '@/utils/req.js'
import { obj2formdatastr } from '@/utils/utils.js'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

const sortOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
]

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
        serviceName: '',
        page: 1,
        limit: 10,
      },
      sortOptions,
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
        serviceName: this.listQuery.serviceName,
        page: this.listQuery.page - 1,
        size: this.listQuery.limit
      })
      request('sg/base/sgService/queryByPage?' + params).then(data => {
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
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$confirm('此操作将永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
      post('/sg/base/sgService//deleteSgService/' + row.serviceId).then(data => {
        this.$notify({
          title: '成功',
          message: '删除成功',
          type: 'success',
          duration: 2000
        })
        const index = this.list.indexOf(row)
        this.list.splice(index, 1)
      })
      row.status = status
      })
    },
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
      request(`/sg/base/sgService`, {
        method: 'post',
        data: {
          module: this.temp.module,
          serviceName: this.temp.serviceName,
          serviceUrl: this.temp.serviceUrl,
          method: this.temp.method,
          accessParams: this.temp.accessParams,
          returnParams: this.temp.returnParams,
        }
      })
        .then(data => {
          if(data.code === 200){
            this.$message({
              message: '新增成功',
              type: 'success'
            })
            this.getList()
            this.dialogFormVisible = false
          }else{
            this.$message({
              message: data.message,
              type: 'error'
            })
          }
        })
        .catch(() => {
          this.$message({
            message: '新增失败',
            type: 'error'
          })
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
      const params = obj2formdatastr(this.temp)
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          put('/sg/item/sgSentimentAddress/update?' + params).then(data => {
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
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
        this.list.splice(index, 1)
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
</style>

