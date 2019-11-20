<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-items">
        <span>主事项名称：</span>
        <el-input v-model="listQuery.like_ItemName" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>名称：</span>
        <el-input v-model="listQuery.like_subItemName" placeholder="请输入" class="filter-item" @keyup.enter.native="handleFilter"/>
      </div>
      <div class="filter-items">
        <span>来源：</span>
        <el-select v-model="listQuery.eq_subIden" placeholder="请选择" clearable style="width: 100%" class="filter-item" @change="handleFilter">
          <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
      </div>
      <div class="filter-items">
        <span>状态：</span>
        <el-select v-model="listQuery.null_itemId" placeholder="请选择" clearable style="width: 100%" class="filter-item" @change="handleFilter">
          <el-option v-for="item in stateOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
      </div>
      <div class="filter-items">
        <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
        <!-- <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">新增</el-button> -->
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
      <el-table-column label="主事项" prop="itemName" min-width="200"/>
      <el-table-column label="事项类型" prop="itemType" min-width="150"/>
      <el-table-column label="子事项" prop="subItemName" min-width="200"/>
      <el-table-column label="子系统" prop="subName" align="center" width="150"/>
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
      <el-form ref="dataForm" class="dataForm" :rules="rules" :model="temp" label-position="left" label-width="140px">
        <el-form-item label="主事项名称" prop="itemName">
          <SelectScroll ref="selectItem" url="sg/twoconitem/getDistinctItem?" rows="rows" objkey="itemName" search="like_ItemName" total="total" emit="setItemName" @setItemName="setItemName"/>
        </el-form-item>
        <el-form-item label="来源" prop="subName">
          <span v-if="dialogStatus === 'update'">{{ temp.subName }}</span>
          <el-select v-else v-model="temp.subName" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key"/>
          </el-select>
        </el-form-item>
        <el-form-item label="事项名称" prop="subItemName">
          <span>{{ temp.subItemName }}</span>
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
import { request, post, reqDelete, put } from '@/utils/req.js'
import { obj2formdatastr } from '@/utils/utils.js'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import SelectScroll from '@/components/SelectScroll' // 无限滚动下拉组建

const sortOptions = [
  { key: 'HL', label: '热线' },
  { key: 'ZW', label: '智网' }
]

export default {
  name: 'ComplexTable',
  components: { SelectScroll, Pagination },
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
        page: 1,
        limit: 10,
        like_subItemName: '',
        like_ItemName: '',
        eq_subIden: '',
        null_itemId: '',
      },
      stateOptions: [
        { key: false, label: '已识别' },
        { key: true, label: '未识别' }
      ],
      sortOptions,
      statusOptions: ['published', 'draft', 'deleted'],
      temp: {
        mid: '',
        itemId: '',
        itemName: '',
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
        this.$refs.selectItem.clear();
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
        like_subItemName: this.listQuery.like_subItemName,
        like_ItemName: this.listQuery.like_ItemName,
        eq_subIden: this.listQuery.eq_subIden,
        null_itemId: this.listQuery.null_itemId,
        page: this.listQuery.page - 1,
        size: this.listQuery.limit,
      })
      request('/sg/twoconitem/search?' + params).then(data => {
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
      // console.log(v)
      this.temp.itemName = v
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
      reqDelete('/sg/twoconitem/' + row.mid).then(data => {
        this.dialogFormVisible = false
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
        mid: '',
        itemId: '',
        itemName: '',
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
          post('/sg/twoconitem/add?' + params).then(data => {
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
      // return console.log(this.temp)
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const params = {
            mid: this.temp.mid,
            itemId: this.temp.itemId,
            itemName: this.temp.itemName,
          }
          post('/sg/twoconitem/', params).then(data => {
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
      reqDelete('/sg/twoconitem/' + row.mid).then(data => {
        this.list.unshift(this.temp)
        this.dialogFormVisible = false
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
    // 导出
    handleDownload() {
      this.downloadLoading = true
      const params = obj2formdatastr({
        page: this.listQuery.page - 1,
        size: this.listQuery.limit
      })
      // const baseURL = this.$store.getters.baseURL
      // window.location.href = baseURL + '/sg/twoconitem/export?' + params
      window.location.href = 'http://19.104.40.37:8082/api/sg/twoconitem/export?' + params
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

