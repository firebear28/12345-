<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>主部门名称：</span>
        <el-input v-model="listQuery.like_departName" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>名称：</span>
        <el-input v-model="listQuery.like_subDepartName" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>来源：</span>
        <el-select v-model="listQuery.eq_subId" placeholder="请选择" clearable style="width: 100%" class="filter-item" @change="handleFilter">
          <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
      </div>
      <div class="filter-items">
        <span>状态：</span>
        <el-select v-model="listQuery.null_departId" placeholder="请选择" clearable style="width: 100%" class="filter-item" @change="handleFilter">
          <el-option v-for="item in stateOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
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
      <el-table-column label="编码" prop="subDepartId" min-width="150"/>
      <el-table-column label="名称" prop="subDepartName" min-width="200"/>
      <el-table-column label="来源" prop="subName" align="center" min-width="100"/>
      <el-table-column label="主部门编码" prop="departId" min-width="150"/>
      <el-table-column label="主部门名称" prop="departName" min-width="200"/>
      <el-table-column label="状态" prop="state" align="center" min-width="150"/>
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
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px">
        <el-form-item label="主部门：" prop="departName">
          <SelectScroll ref="selectDepa" url="sg/department/sgMainDepartment/searchDistinctDepart?" rows="rows" objkey="departName" search="like_departName" searchKey="departId" total="total" emit="setItemName" @setItemName="setItemName"/>
        </el-form-item>
        <el-form-item label="系统：" prop="subName">
          <span v-if="dialogStatus === 'update'">{{ temp.subName }}</span>
          <el-select v-else v-model="temp.subName" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
          </el-select>
        </el-form-item>
        <el-form-item label="系统部门：" prop="subDepartName">
          <span v-if="dialogStatus === 'update'">{{ temp.subDepartName }}</span>
          <!-- <el-input v-model="temp.subDepartName"/> -->
          <SelectScroll v-else ref="selectSubDepa" url="sg/department/sgMainDepartment/searchDistinctSubDepart?" rows="rows" objkey="subDepartName" search="like_subDepartName" searchKey="subDepartId" total="total" emit="setSubItemName" @setSubItemName="setSubItemName"/>
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
import SelectScroll from '@/components/SelectScroll' // 无限滚动下拉组建

export default {
  name: 'ComplexTable',
  components: { Pagination, SelectScroll },
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        like_departName: '',
        like_subDepartName: '',
        eq_subId: '',
        null_departId: '',
        page: 1,
        limit: 10
      },
      sortOptions: [
        { key: 'HL', label: '热线' },
        { key: 'ZW', label: '智网' }
      ],
      stateOptions: [
        { key: false, label: '已识别' },
        { key: true, label: '未识别' }
      ],
      statusOptions: ['published', 'draft', 'deleted'],
      temp: {
        id: '',
        departName: '',
        subDepartName: '',
        subName: '',
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
  watch: {
    dialogFormVisible(v) {
      if(v === false){
        this.$refs.selectDepa.clear();
        this.$refs.selectSubDepa.clear();
      }
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
        size: this.listQuery.limit,
        like_departName: this.listQuery.like_departName,
        like_subDepartName: this.listQuery.like_subDepartName,
        eq_subId: this.listQuery.eq_subId,
        null_departId: this.listQuery.null_departId,
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
    setItemName(v) {
      this.temp.departName = v
    },
    setSubItemName(v) {
      // console.log(v)
      this.temp.subDepartName = v
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
      post('/sg/department/sgMainDepartment/delete?' + row.departId).then(data => {
        this.$message({
          message: '操作成功',
          type: 'success'
        })
      })
      row.status = status
      })
    },
    resetTemp() {
      this.temp = {
        id: '',
        departName: '',
        subDepartName: '',
        subName: '',
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
      const params = {
        id: '',
        departId: this.temp.departId,
        departName: this.temp.departName,
        subName: this.temp.subName,
      }
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          post('/sg/department/sgMainDepartment', params).then(data => {
            if(data.code === 200){
              // this.list.unshift(this.temp)
              this.dialogFormVisible = false
              this.$notify({
                title: '成功',
                message: '创建成功',
                type: 'success',
                duration: 2000
              })
            }else{
              this.$notify({
                title: '错误',
                message: data.message,
                type: 'error',
                duration: 2000
              })
            }
            this.getList()
          })
        }
      })
    },
    // 点击编辑
    handleUpdate(row) {
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.temp = Object.assign({}, row) // copy obj
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    // 提交编辑
    updateData() {
      // return console.log(this.temp)
      const params = {
        id: this.temp.id,
        departId: this.temp.departId,
        departName: this.temp.departName,
        subName: this.temp.subName,
      }
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          post('/sg/department/sgMainDepartment', params).then(data => {
            if(data.code === 200){
              this.dialogFormVisible = false
              this.$notify({
                title: '成功',
                message: '更新成功',
                type: 'success',
                duration: 2000
              })
            }else{
              this.$notify({
                title: '错误',
                message: data.message,
                type: 'error',
                duration: 2000
              })
            }
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
    // 导出
    handleDownload() {
      this.downloadLoading = true
      const params = obj2formdatastr({
        month: '201812',
        pageNumber: this.listQuery.page - 1,
        pageSize: this.listQuery.limit,
        state: this.listQuery.state,
        property: 'acceptTime',
        direction: 'DESC'
      })
      
      window.location.href = 'http://19.104.40.37:8082/api/sg/citymanagement/export?' + params
      this.downloadLoading = false
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

