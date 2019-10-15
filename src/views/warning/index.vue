<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>部门：</span>
        <el-input v-model="listQuery.departName" placeholder="请输入" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
        <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">新增</el-button> -->
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
      <el-table-column label="部门" prop="departName" min-width="200"/>
      <el-table-column label="逾期数预警值" prop="cardAlarm" width="200"/>
      <el-table-column label="总数预警值" prop="countAlarm" min-width="200"/>
      <el-table-column label="办结率预警值" prop="doneAlarm" width="200"/>
      <el-table-column label="满意度预警值" prop="satisfyAlarm" width="250"/>
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
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="140px">
        <el-form-item label="部门" prop="departName">
          <span v-if="dialogStatus === 'update'">{{ temp.departName }}</span>
        </el-form-item>
        <el-form-item label="逾期数预警值" prop="cardAlarm">
          <el-input v-model="temp.cardAlarm"/>
        </el-form-item>
        <el-form-item label="总数预警值" prop="countAlarm">
          <el-input v-model="temp.countAlarm"/>
        </el-form-item>
        <el-form-item label="办结率预警值" prop="doneAlarm">
          <el-input v-model="temp.doneAlarm"/>
        </el-form-item>
        <el-form-item label="满意度预警值" prop="satisfyAlarm">
          <el-input v-model="temp.satisfyAlarm"/>
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
        departName: '',
        page: 1,
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
        departName: this.listQuery.departName,
        page: this.listQuery.page,
        size: this.listQuery.limit
      })
      request('sg/department/sgDepartmentAlarm/queryByPage?' + params).then(data => {
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
      this.listQuery.page = 1
      this.listQuery.limit = 10
      this.getList()
    },
    handleModifyStatus(row, status) {
      reqDelete('/sg/department/sgDepartmentAlarm/deleteSgDepartmentAlarm/' + row.departId).then(data => {
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
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.temp = Object.assign({}, row) // copy obj
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
    handleDownload() {
      this.downloadLoading = true
      const params = obj2formdatastr({
        page: this.listQuery.page,
        size: this.listQuery.limit
      })
      window.location.href = 'http://12345v2.dgdatav.com:6080/api/sg/item/sgSentimentAddress/export?' + params
      this.downloadLoading = false
    },
  }
}
</script>
<style lang="scss" scoped>
  .filter-container{
    display: flex;
    justify-content: flex-start;
    .filter-items {
      display: flex;
      justify-content: flex-start;
      align-items: baseline;
      margin-right: 20px;
      span {
        white-space: nowrap;
      }
    }
  }
  .dataForm {
    width: 100%;
    padding: 50px;
  }
</style>

