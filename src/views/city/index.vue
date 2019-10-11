<template>
  <div class="app-container">
    <div class="filter-container">
      <div>
        ID查询：
        <el-input
          v-model="listQuery.id"
          placeholder="请输入订单编号"
          style="width: 200px;"
          clearable
          @keyup.enter.native="handleFilter"
          @clear="getList"
        />
      </div>
      <div>
        状态：
        <el-select
          v-model="listQuery.state"
          placeholder="请选择状态"
          clearable
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
        日期：
        <el-date-picker
          v-model="month"
          type="month"
          value-format="yyyyMM"
          placeholder="选择月"
          @change="changeDtae"
        />
      </div>
      <div>
        <el-button v-waves type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
        <el-button
          v-waves
          :loading="downloadLoading"
          type="primary"
          icon="el-icon-download"
          @click="handleDownload"
        >导出</el-button>
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      empty-text
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
      <el-table-column label="标题" prop="title" min-width="200" />
      <el-table-column label="专题分类" prop="subClazz" width="150" />
      <el-table-column label="专题标签" prop="subTags" width="150" />
      <el-table-column label="专题分类的准确率" prop="subClazzProba" align="center" width="135" />
      <el-table-column label="专题标签的准确率" prop="subTagsProba" align="center" width="135" />
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :visible.sync="dialogFormVisible" title="编辑">
      <el-form
        ref="dataForm"
        :model="temp"
        label-width="140px"
        style="width: 100%; padding-left:50px; padding-right:50px;"
      >
        <el-form-item label="标题：" prop="title">
          <span>{{ temp.title }}</span>
        </el-form-item>
        <el-form-item label="状态：" prop="state">
          <el-select v-model="temp.state" placeholder="请选择状态" clearable style="width:80%">
            <el-option
              v-for="item in calendarTypeOptions"
              :key="item.key"
              :label="item.label"
              :value="item.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专题分类：" prop="subClazz">
          <el-input v-model="temp.subClazz" style="width:80%"/>
        </el-form-item>
        <el-form-item label="专题标签：" prop="subTags">
          <!-- <el-input v-model="temp.subTags" /> -->
          <el-cascader
            ref="cascader"
            :options="matterItems"
            :props="props"
            v-model="temp.subTags"
            :show-all-levels="false"
            placeholder="请选择"
            filterable
            clearable
            style="width:80%"
          />
        </el-form-item>
        <el-form-item label="专题分类的准确率：" prop="subClazzProba">
          <span>{{ temp.subClazzProba }}</span>
        </el-form-item>
        <el-form-item label="专题标签的准确率：" prop="subTagsProba">
          <span>{{ temp.subTagsProba }}</span>
        </el-form-item>
        <el-form-item label="投诉内容：" prop="content">
          <div class="content">{{ temp.content }}</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="updateData()">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import waves from '@/directive/waves' // Waves directive
import { request, put } from '@/utils/req.js'
import { obj2formdatastr, maybe } from '@/utils/utils.js'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

const calendarTypeOptions = [
  { key: '10', label: '可用初始训练数据' },
  { key: '11', label: '人工校准' },
  { key: '12', label: '识率很高数据' },
  { key: '13', label: '临时标志中间处理数据' }
]

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      month: '',
      list: null,
      total: 0,
      listLoading: false,
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
      // 状态切换
      calendarTypeOptions,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      props: {
        value: 'label',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        emitPath: false
      },
      // 专题标签
      matterItems:
        maybe(
          _ => JSON.parse(window.localStorage.getItem('themeMatterItems')),
          []
        ) || [],
      downloadLoading: false
    }
  },
  created() {
    this.getList()
    this.changeTopics()
  },
  methods: {
    getList() {
      this.listLoading = true
      if (!this.month) this.month = ''
      if (!this.state) this.state = ''
      const params = obj2formdatastr({
        month: this.month,
        pageNumber: this.listQuery.page,
        pageSize: this.listQuery.limit,
        state: this.listQuery.state,
        property: 'acceptTime',
        direction: 'DESC'
      })
      request('/sg/citymanagement/findByPage?' + params).then(data => {
        this.list = data.content
        this.total = data.totalElements

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    indexMethod(index) {
      return index + 1 + 10 * (this.listQuery.page - 1)
    },
    // 获取专题标签
    changeTopics() {
      if (!this.matterItems.length) {
        request('/sg/base/sgSubjectItem/getAllSubjectItemList').then(result => {
          // 数据清洗与初始化
          this.matterItems = maybe(_ => result, []).map(data =>
            Object.assign({}, data, { value: '__TOP__' + data.value })
          )
          // 插入缓存
          window.localStorage.setItem(
            'themeMatterItems',
            JSON.stringify(this.matterItems)
          )
        })
      }
    },
    handleFilter() {
      if (!this.listQuery.id) {
        this.getList()
      } else {
        request('/sg/citymanagement/' + this.listQuery.id).then(data => {
          data ? this.list = data : this.list = []
          this.listQuery.page = 1
          this.total = 1
          // Just to simulate the time of the request
          setTimeout(() => {
            this.listLoading = false
          }, 0.5 * 1000)
        })
      }
    },
    // 编辑
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          const params = obj2formdatastr({
            orderId: this.temp.orderId,
            state: this.temp.state,
            subClazz: this.temp.subClazz,
            subTags: this.temp.subTags
          })
          put('/sg/citymanagement?' + params).then(data => {
            if (data.code === 200) {
              this.getList()
              this.$message.success('修改成功！')
              this.dialogFormVisible = false
            }
          })
        }
      })
    },
    // 切换时间
    changeDtae() {
      this.getList()
    },
    handleDownload() {
      const params = obj2formdatastr({
        month: this.month,
        pageNumber: this.listQuery.page,
        pageSize: this.listQuery.limit,
        state: this.listQuery.state,
        property: 'acceptTime',
        direction: 'DESC'
      })

      const path = process.env.NODE_ENV === 'development' ? 'http://12345v2.alltosea.com:6080/' : '/'

      window.open(path + 'api/sg/citymanagement/export?' + params)
    }
  }
}
</script>
<style lang="scss" scoped>
.filter-container {
  display: flex;
  justify-content: space-between;
}
/deep/.el-textarea__inner {
  height: 120px;
}
.content {
  height: 150px;
  overflow: auto;
  padding: 0 10px;
  background-color: beige;
}
</style>

