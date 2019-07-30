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
        <el-button
          v-waves
          class="filter-item"
          type="primary"
          icon="el-icon-search"
          @click="handleFilter"
        >查询</el-button>
        <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">{{ $t('table.add') }}</el-button> -->
        <!-- <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">导出</el-button> -->
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column
        :index="indexMethod"
        type="index"
        label="序号"
        sortable="custom"
        align="center"
        width="75"
      />
      <el-table-column label="标题" prop="cardAlarm" min-width="200">
        <!-- <template slot-scope="scope">
          <span>{{ scope.row.title }}</span>
        </template>-->
      </el-table-column>
      <el-table-column label="专题分类" prop="countAlarm" width="150">
        <!-- <template slot-scope="scope">
          <span>{{ scope.row.subClazz }}</span>
        </template>-->
      </el-table-column>
      <el-table-column label="专题标签" prop="departName" width="150">
        <!-- <template slot-scope="scope">
          <span>{{ scope.row.subTags }}</span>
        </template>-->
      </el-table-column>
      <el-table-column label="专题分类的准确率" prop="doneAlarm" align="center" width="135">
        <!-- <template slot-scope="scope">
          <span>{{ scope.row.subClazzProba }}</span>
        </template>-->
      </el-table-column>
      <el-table-column label="专题标签的准确率" prop="satisfyAlarm" align="center" width="135">
        <!-- <template slot-scope="scope">
          <span>{{ scope.row.subTagsProba }}</span>
        </template>-->
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" @click="handleModifyStatus(scope.row,'deleted')">删除</el-button>
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
        <el-form-item label="名称" prop="cardAlarm">
          <el-input v-model="temp.cardAlarm" />
        </el-form-item>
        <el-form-item label="账号类型" prop="countAlarm">
          <el-input v-model="temp.countAlarm" />
        </el-form-item>
        <el-form-item label="登录账号" prop="departName">
          <el-input v-model="temp.departName" />
        </el-form-item>
        <el-form-item label="密码" prop="doneAlarm">
          <el-input v-model="temp.doneAlarm" />
        </el-form-item>
        <el-form-item label="邮件" prop="satisfyAlarm">
          <el-input v-model="temp.satisfyAlarm" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">提交</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">{{ $t('table.confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  createArticle,
  updateArticle
} from '@/api/article'
import waves from '@/directive/waves' // Waves directive
import { request, post } from '@/utils/req.js'
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
        id: '',
        page: 1,
        limit: 10,
        importance: undefined,
        title: undefined,
        type: undefined,
        state: '',
        sort: '+id'
      },
      statusOptions: ['published', 'draft', 'deleted'],
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [
          { required: true, message: 'type is required', trigger: 'change' }
        ],
        timestamp: [
          {
            type: 'date',
            required: true,
            message: 'timestamp is required',
            trigger: 'change'
          }
        ],
        title: [
          { required: true, message: 'title is required', trigger: 'blur' }
        ]
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
      request('/sg/department/sgDepartmentAlarm/queryByPage?' + params).then(
        data => {
          this.list = data.content
          this.total = data.totalElements

          // Just to simulate the time of the request
          setTimeout(() => {
            this.listLoading = false
          }, 0.5 * 1000)
        }
      )
    },
    indexMethod(index) {
      return index + 1 + 10 * (this.listQuery.page - 1)
    },
    changeTopics() {
      // 路由跳转
      this.$router.push({ path: '/' + this.listQuery.type + '/index' })
    },
    handleFilter() {
      request(
        '/sg/department/sgDepartmentAlarm/queryById/' + this.listQuery.id
      ).then(data => {
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
      post(
        '/sg/department/sgDepartmentAlarm/deleteSgDepartmentAlarm/' + row.departId
      )
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
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
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
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
          createArticle(this.temp).then(() => {
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
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            for (const v of this.list) {
              if (v.id === this.temp.id) {
                const index = this.list.indexOf(v)
                this.list.splice(index, 1, this.temp)
                break
              }
            }
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

