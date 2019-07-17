<template>
  <div class="app-container">
    <div class="filter-container">
      <div>
        ID查询：
        <el-input
          v-model="listQuery.id"
          placeholder="请输入订单编号"
          style="width: 200px;"
          class="filter-item"
          @keyup.enter.native="handleFilter"
        />
      </div>
      <div>
        名称：
        <el-select
          v-model="listQuery.state"
          placeholder="请选择名称"
          clearable
          class="filter-item"
          style="width: 130px"
          @change="getList"
        >
          <el-option
            v-for="item in calendarTypeOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
      </div>
      <div>
        当前专题：
        <el-select
          v-model="listQuery.type"
          placeholder="请选择专题"
          clearable
          style="width: 140px"
          class="filter-item"
          @change="changeTopics"
        >
          <el-option
            v-for="item in sortOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
      </div>
      <div>
        <el-button
          v-waves
          class="filter-item"
          type="primary"
          icon="el-icon-search"
          @click="handleFilter"
        >查询</el-button>
        <el-button
          class="filter-item"
          style="margin-left: 10px;"
          type="primary"
          icon="el-icon-edit"
          @click="handleCreate"
        >新增</el-button>
        <el-button
          v-waves
          :loading="downloadLoading"
          class="filter-item"
          type="primary"
          icon="el-icon-download"
          @click="handleDownload"
        >导出</el-button>
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column
        :index="indexMethod"
        type="index"
        label="序号"
        sortable="custom"
        align="center"
        width="75"
      />
      <el-table-column label="名称" prop="fullname" width="120"/>
      <el-table-column label="登陆账号" prop="account" width="200"/>
      <el-table-column label="邮件" prop="email" min-width="200"/>
      <el-table-column label="手机号" prop="mobile" align="center" width="220"/>
      <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="warning" size="mini" @click="grtIP(scope.row)">IP管理</el-button>
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" @click="handleModifyStatus(scope.row,'delete')">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="70px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="名称" prop="fullname">
          <el-input v-model="temp.fullname"/>
        </el-form-item>
        <el-form-item label="账号类型" prop="accounttype">
          <el-input v-model="temp.accounttype"/>
        </el-form-item>
        <el-form-item label="登录账号" prop="account">
          <el-input v-model="temp.account"/>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="temp.password"/>
        </el-form-item>
        <el-form-item label="邮件" prop="email">
          <el-input v-model="temp.email"/>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="temp.mobile"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">提交</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="ipFormVisible" title="IP管理">
      <el-table v-loading="ipLoading" :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="account" label="用户名"/>
        <el-table-column prop="clientIp" label="IP"/>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button size="mini" type="danger" @click="handleDeleteIP(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div>
        新建IP：
        <el-input
          v-model="createIP"
          placeholder="请输入IP地址"
          style="width: 300px; margin-top: 50px;"
          class="filter-item"
          @keyup.enter.native="handleCreateIP"
        />
        <el-button
          class="filter-item"
          style="margin-left: 10px;"
          type="primary"
          icon="el-icon-edit"
          @click="handleCreateIP"
        >新增</el-button>
      </div>
      <!-- <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="ipFormVisible = false">确认</el-button>
      </span> -->
    </el-dialog>
  </div>
</template>

<script>
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import { request, post } from '@/utils/req.js'
import { obj2formdatastr } from '@/utils/utils.js'
import { getToken, getUserAgent } from '@/utils/auth'
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

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      token: '',
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      ipLoading: true,
      createIP: '',
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
        isNew: true,
        userid: '',
        fullname: '',
        accounttype: '',
        account: '',
        password: '',
        email: '',
        mobile: ''
      },
      // 新建、编辑表单
      dialogFormVisible: false,
      // ip管理
      ipFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新增'
      },
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
    grtIP(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.ipFormVisible = true
      this.ipLoading = true
      request(
        `/sg/base/sgUserIp/search?eq_userid=${row.userid}`
      ).then(data => {
        this.pvData = data.rows
        setTimeout(() => {
          this.ipLoading = false
        }, 0.5 * 1000)
      })
    },
    handleDeleteIP(row) {
      post(
        `/sg/base/sgUserIp/delete?id=${row.userIpId}`
      ).then(data => {
        this.$message({
          message: '删除成功',
          type: 'success'
        })
        this.grtIP(row)
      })
        .catch(() => {
          this.$message({
            message: '删除失败',
            type: 'error'
          })
        })
    },
    handleCreateIP(row) {
      request(
        `/sg/base/sgUserIp`, {
          method: 'post',
          data: {
            'account': this.temp.account,
            'clientIp': this.createIP,
            'userid': this.temp.userid
          }
        }).then(data => {
        this.$message({
          message: '新建成功',
          type: 'success'
        })
        this.grtIP(this.temp)
      })
        .catch(() => {
          this.$message({
            message: '新建失败',
            type: 'error'
          })
        })
    },
    getList() {
      this.listLoading = true
      request(
        `/admin/user/sysUser/search?size=${this.listQuery.limit}&page=${this.listQuery.page - 1}&tokenid=${getToken()}&userAgent=${getUserAgent()}`
      ).then(data => {
        this.list = data.rows
        this.total = data.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    indexMethod(index) {
      return index + 1 + 10 * (this.listQuery.page - 1)
    },
    changeTopics() {
      // 路由跳转
      this.$router.push({ path: '/' + this.listQuery.type + '/index' })
    },
    handleFilter() {
      request('/admin/user/sysUser/' + this.listQuery.id).then(data => {
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
    // 删除
    handleModifyStatus(row, status) {
      post('/admin/user/sysUser/delete?id=' + row.userid)
        .then(data => {
          this.$message({
            message: '删除成功',
            type: 'success'
          })
          this.getList()
          row.status = status
        })
        .catch(() => {
          this.$message({
            message: '删除失败',
            type: 'error'
          })
        })
    },
    resetTemp() {
      this.temp = {
        isNew: true,
        userid: '',
        fullname: '',
        accounttype: '',
        account: '',
        password: '',
        email: '',
        mobile: ''
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
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          post('/admin/user/sysUser?' + params).then(data => {
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
      this.temp.isNew = false
      const params = obj2formdatastr(this.temp)
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          post('/admin/user/sysUser?' + params).then(data => {
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
      this.$notify({
        title: '成功',
        message: '删除成功',
        type: 'success',
        duration: 2000
      })
      const index = this.list.indexOf(row)
      this.list.splice(index, 1)
    },
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
      window.location.href =
        'http://12345v1.dgdatav.com:6080/api/sg/citymanagement/export?' +
        params
      request('/sg/citymanagement/export?' + params).then(data => {
        this.downloadLoading = false
      })
    },
    formatJson(filterVal, jsonData) {
      return jsonData.map(v =>
        filterVal.map(j => {
          if (j === 'timestamp') {
            return parseTime(v[j])
          } else {
            return v[j]
          }
        })
      )
    }
  }
}
</script>
<style lang="scss" scoped>
.filter-container {
  display: flex;
  justify-content: space-between;
}
</style>

