<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>服务名称：</span>
        <el-input v-model="listQuery.serviceName" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>账号：</span>
        <el-input v-model="listQuery.userAccount" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>账号名称：</span>
        <el-input v-model="listQuery.userFullname" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
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
      <el-table-column label="服务名称" prop="serviceName" min-width="200"/>
      <el-table-column label="账号" prop="userAccount" min-width="200"/>
      <el-table-column label="账号名称" prop="userFullname" min-width="200"/>
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
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="120px" style="width: 450px; margin-left:50px;">
        <el-form-item label="主键" prop="bid">
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
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import { request, post, put, reqDelete } from '@/utils/req.js'
import { obj2formdatastr } from '@/utils/utils.js'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

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
        userAccount: '',
        userFullname: '',
        page: 0,
        limit: 10,
      },
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
        userAccount: this.listQuery.userAccount,
        userFullname: this.listQuery.userFullname,
        page: this.listQuery.page,
        size: this.listQuery.limit
      })
      request('sg/base/sgServiceUser/queryByPage?' + params).then(data => {
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
      this.listQuery.page = 0
      this.listQuery.limit = 10
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$confirm('此操作将永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
      reqDelete('/sg/base/sgServiceUser/deleteSgServicUser/' + row.serviceId).then(data => {
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
      const params = obj2formdatastr(this.temp)
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          post('/sg/item/sgSentimentAddress/add?' + params).then(data => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
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
        page: this.listQuery.page,
        size: this.listQuery.limit
      })
      window.location.href = 'http://12345v2.dgdatav.com:6080/api/sg/item/sgSentimentAddress/export?' + params
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

