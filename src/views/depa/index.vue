<template>
  <div class="app-container">
    <div class="filter-container">
      <div>
        ID查询：
        <el-input v-model="listQuery.id" placeholder="请输入订单编号" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div>
        名称：
        <el-select v-model="listQuery.state" placeholder="请选择名称" clearable class="filter-item" style="width: 130px" @change="getList">
          <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
      </div>
      <div>
        当前专题：
        <el-select v-model="listQuery.type" placeholder="请选择专题" clearable style="width: 140px" class="filter-item" @change="changeTopics">
          <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
      </div>
      <div>
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">添加</el-button>
        <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">导出</el-button>
      </div>
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
      <el-table-column label="部门ID" prop="departId" width="100"/>
      <el-table-column label="部门名称" prop="departName" min-width="150"/>
      <el-table-column label="备注" prop="remark" width="150"/>
      <el-table-column label="上级部门ID" prop="rootDepartId" align="center" width="135"/>
      <el-table-column label="上级部门名称" prop="rootDepartName" align="center" width="135"/>
      <el-table-column label="子系统部门ID" prop="subDepartId" align="center" width="135"/>
      <el-table-column label="子系统部门名称" prop="subDepartName" align="center" width="135"/>
      <el-table-column label="子系统ID（HL|ZW）" prop="subId" align="center" width="150"/>
      <el-table-column label="子系统上级部门ID" prop="subRootDepartId" align="center" width="135"/>
      <el-table-column label="子系统上级部门名称" prop="subRootDepartName" align="center" width="150"/>
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
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="140px" style="width: 500px; margin-left:50px;">
        <el-form-item label="部门ID" prop="departId">
          <el-input v-model="temp.departId"/>
        </el-form-item>
        <el-form-item label="部门名称" prop="departName">
          <el-input v-model="temp.departName"/>
        </el-form-item>
        <el-form-item label="上级部门ID" prop="rootDepartId">
          <el-input v-model="temp.rootDepartId"/>
        </el-form-item>
        <el-form-item label="上级部门名称" prop="rootDepartName">
          <el-input v-model="temp.rootDepartName"/>
        </el-form-item>
        <el-form-item label="子系统部门ID" prop="subDepartId">
          <el-input v-model="temp.subDepartId"/>
        </el-form-item>
        <el-form-item label="子系统部门等级" prop="subDepartLevel">
          <el-input v-model="temp.subDepartLevel"/>
        </el-form-item>
        <el-form-item label="子系统部门名称" prop="subDepartName">
          <el-input v-model="temp.subDepartName"/>
        </el-form-item>
        <el-form-item label="子系统ID（HL|ZW）" prop="subId">
          <el-input v-model="temp.subId"/>
        </el-form-item>
        <el-form-item label="子系统上级部门ID" prop="subRootDepartId">
          <el-input v-model="temp.subRootDepartId"/>
        </el-form-item>
        <el-form-item label="子系统上级部门名称" prop="subRootDepartName">
          <el-input v-model="temp.subRootDepartName"/>
        </el-form-item>
        <el-form-item label="子系统部门父类型" prop="subRootDepartType">
          <el-input v-model="temp.subRootDepartType"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input :autosize="{ minRows: 2, maxRows: 4}" v-model="temp.remark" type="textarea" placeholder="Please input"/>
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
import { request, post } from '@/utils/req.js'
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
  { key: 'service', label: '服务提供管控日志' },
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
        departId: '',
        departName: '',
        id: '',
        isNew: '',
        remark: '',
        rootDepartId: '',
        subDepartId: '',
        subDepartLevel: '',
        subDepartName: '',
        subId: '',
        subRootDepartId: '',
        subRootDepartName: '',
        subRootDepartType: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '添加'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        // type: [{ required: true, message: 'type is required', trigger: 'change' }],
        // timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        // title: [{ required: true, message: 'title is required', trigger: 'blur' }]
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
        page: this.listQuery.page,
        size: this.listQuery.limit
      })
      request('/sg/department/sgMainDepartment/search?' + params).then(data => {
        this.list = data.rows
        this.total = data.total

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
      request('/sg/department/sgMainDepartment/' + this.listQuery.id).then(data => {
        this.list = []
        this.list.push(data)
        this.listQuery.page = 1
        this.total = 1
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    handleModifyStatus(row, status) {
      post('/sg/department/sgMainDepartment/delete?' + row.departId).then(data => {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
      })
      row.status = status
    },
    resetTemp() {
      this.temp = {
        departId: '',
        departName: '',
        id: '',
        isNew: true,
        remark: '',
        rootDepartId: '',
        subDepartId: '',
        subDepartLevel: '',
        subDepartName: '',
        subId: '',
        subRootDepartId: '',
        subRootDepartName: '',
        subRootDepartType: ''
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
          post('/sg/department/sgMainDepartment?' + params).then(data => {
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
      this.temp.isNew = false
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
          post('/sg/department/sgMainDepartment?' + params).then(data => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row) {
      this.$notify({
        title: '成功',
        message: '删除成功',
        type: 'success',
        duration: 2000
      })
      const index = this.list.indexOf(row)
      this.list.splice(index, 1)
    },
    // 导出
    handleDownload() {
      this.downloadLoading = true
      const params = obj2formdatastr({
        month: '201812',
        pageNumber: this.listQuery.page,
        pageSize: this.listQuery.limit,
        state: this.listQuery.state,
        property: 'acceptTime',
        direction: 'DESC'
      })
      request('/sg/citymanagement/export?' + params).then(data => {
        window.location.href = 'http://12345v1.dgdatav.com:6080/api/sg/citymanagement/export?' + params
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
.filter-container{
  display: flex;
  justify-content: space-between;
}
</style>

