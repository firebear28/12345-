<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>登录账号：</span>
        <el-input v-model="listQuery.account" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter" />
      </div>
      <div class="filter-items">
        <span>名称：</span>
        <el-input v-model="listQuery.fullname" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter" />
      </div>
      <div class="filter-items">
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
      <el-table-column label="名称" prop="fullname" min-width="120" />
      <el-table-column label="登录账号" prop="account" min-width="200" />
      <!-- <el-table-column label="邮件" prop="email" min-width="200" /> -->
      <el-table-column label="手机号" prop="mobile" min-width="220" />
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="warning" size="mini" @click="grtIP(scope.row)">IP管理</el-button>
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <!-- <el-button size="mini" type="danger" @click="handleModifyStatus(scope.row,'delete')">删除</el-button> -->
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
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="140px">
        <el-form-item label="名称" prop="fullname">
          <el-input v-model="temp.fullname" />
        </el-form-item>
        <el-form-item label="身份证" prop="idNumber">
          <el-input v-model="temp.idNumber" />
        </el-form-item>
        <el-form-item label="登录账号" prop="account">
          <el-input v-model="temp.account" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogStatus != 'update'">
          <el-input v-model="temp.password" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="temp.mobile" />
        </el-form-item>
        <el-form-item label="IMEI" prop="phone">
          <el-input v-model="temp.phone" />
        </el-form-item>
        <el-form-item label="状态：" prop="status">
          <el-select v-model="temp.status" placeholder="请选择状态" clearable style="width:100%">
            <el-option
              v-for="item in state"
              :key="item.key"
              :label="item.label"
              :value="item.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">提交</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="ipFormVisible" title="IP管理">
      <el-table
        v-loading="ipLoading"
        :data="pvData"
        border
        fit
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column prop="account" label="用户名" />
        <el-table-column prop="clientIp" label="IP" />
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
      </span>-->
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

const state = [
  { key: 1, label: '有效' },
  { key: 0, label: '无效' },
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
        account: '',
        fullname: '',
        page: 1,
        limit: 10,
      },
      statusOptions: ['published', 'draft', 'deleted'],
      temp: {
        isNew: true,
        userid: '',
        fullname: '',
        idNumber: '',
        account: '',
        password: '',
        phone: '',
        mobile: '',
        status: 1
      },
      // 状态切换
      state,
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
        fullname: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
        account: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
        password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
        mobile: [{ required: true, message: '手机号不能为空', trigger: 'blur' }]
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
      request(`/sg/base/sgUserIp/search?eq_userid=${row.userid}`).then(data => {
        this.pvData = data.rows
        setTimeout(() => {
          this.ipLoading = false
        }, 0.5 * 1000)
      })
    },
    handleDeleteIP(row) {
      post(`/sg/base/sgUserIp/delete?id=${row.userIpId}`)
        .then(data => {
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
      request(`/sg/base/sgUserIp`, {
        method: 'post',
        data: {
          account: this.temp.account,
          clientIp: this.createIP,
          userid: this.temp.userid
        }
      })
        .then(data => {
          if(data.code === 200){
            this.$message({
              message: '新建成功',
              type: 'success'
            })
            this.grtIP(this.temp)
          }else{
            this.$message({
              message: data.message,
              type: 'error'
            })
          }
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
      const params = obj2formdatastr({
        page: this.listQuery.page - 1,
        size: this.listQuery.limit,
        eq_account: this.listQuery.account,
        like_fullname: this.listQuery.fullname,
      })
      request( `/admin/user/sysUser/search?` + params ).then(data => {
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
      this.listQuery.page = 1
      this.getList()
    },
    // 删除
    handleModifyStatus(row, status) {
      this.$confirm('此操作将永久删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
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
        mobile: '',
        status: 1
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
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const data = {
            isNew: true,
            account: this.temp.account,
            password: this.temp.password,
            fullname: this.temp.fullname,
            mobile: this.temp.mobile,
            idNumber: this.temp.idNumber,
            status: this.temp.status,
            phone: this.temp.phone
          }
          const params = obj2formdatastr(data)
          post(`/admin/user/sysUser?` + params).then(data => {
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
            this.dialogFormVisible = false
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
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const data = {
            isNew: false,
            userid: this.temp.userid,
            account: this.temp.account,
            fullname: this.temp.fullname,
            mobile: this.temp.mobile,
            idNumber: this.temp.idNumber,
            status: this.temp.status,
            phone: this.temp.phone
          }
          const params = obj2formdatastr(data)
          post(`/admin/user/sysUser?` + params).then(data => {
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
            this.dialogFormVisible = false
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
        status: this.listQuery.status,
        property: 'acceptTime',
        direction: 'DESC'
      })
      window.location.href =
        'http://12345v2.dgdatav.com:6080/api/sg/citymanagement/export?' + params
        this.downloadLoading = false
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
</style>

