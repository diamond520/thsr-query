<template>
  <div>
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="車次" prop="trainNo" :rules="rules">
        <el-select
          v-model="form.trainNo"
          filterable
          :allow-create="true"
          no-data-text="暫無車次"
          no-match-text="查無車次"
          placeholder="輸入車次"
          :remote-method="getTimetable">
          <el-option
            v-for="trainNo in trainOptions"
            :key="trainNo"
            :label="trainNo"
            :value="trainNo">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">送出</el-button>
      </el-form-item>
    </el-form>
    <el-card v-if="timetable.TrainNo">
      <div slot="header" class="clearfix">
        {{ `車次：${timetable.TrainNo}` }}
      </div>
      <el-timeline v-if="timetable.Stops">
        <el-timeline-item
          v-for="(stop, i) in timetable.Stops"
          type="primary"
          :key="i"
          :timestamp="stop.DepartureTime">
          {{stop.StationName.Zh_tw}}
        </el-timeline-item>
      </el-timeline>
      <div v-else>{{ '查無車次資料' }}</div>
    </el-card>
  </div>
</template>

<script>
import {getGeneralTimetable, getGeneralTimetablebyTrainNo} from '@/api/thrs-api'
export default {
  data() {
    return {
      form: {
        trainNo: ''
      },
      rules: {
        required: true,
        message: '請輸入車次',
        trigger: 'blur'
      },
      trainOptions: [],
      timetable: {}
    }
  },
  mounted() {
    this.getTimetable()
  },
  methods: {
    async getTimetable() {
      const result = await getGeneralTimetable()
      this.trainOptions = result.map(item => item.GeneralTimetable.GeneralTrainInfo.TrainNo)
    },
    async getTimetablebyTrainNo() {
      const result = await getGeneralTimetablebyTrainNo(this.form.trainNo)
      if(result.length === 0) {
        this.timetable = {
          TrainNo: this.form.trainNo
        }
        return
      }
      this.timetable = {
        TrainNo: result[0].GeneralTimetable.GeneralTrainInfo.TrainNo,
        Stops: result[0].GeneralTimetable.StopTimes
      }
    },
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          this.getTimetablebyTrainNo()
        } else {
          console.warn('error submit!!')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
