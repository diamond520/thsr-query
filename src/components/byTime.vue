<template>
  <el-form ref="form" :model="form" :rules="rules" label-width="80px">
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="出發站" prop="fromStation">
          <el-select v-model="form.fromStation" placeholder="出發站">
            <el-option v-for="(station, index) in stations" :key="index" :label="station.text" :value="station.id"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-form-item label="到達站" prop="toStation">
          <el-select v-model="form.toStation" placeholder="到達站">
            <el-option v-for="(station, index) in stations" :key="index" :label="station.text" :value="station.id"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="出發時間" prop="arrive">
          <el-switch
            v-model="form.arrive"
            active-text="抵達時間"
            inactive-color="#13ce66"
            inactive-text="">
          </el-switch>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :label="timeLabel" prop="time">
          <el-date-picker
            v-model="form.time"
            type="datetime"
            format="yyyy-MM-dd HH:mm"
            value-format="yyyy-MM-dd HH:mm"
            :placeholder="timeLabel">
            <el-button slot="append" icon="el-icon-search"></el-button>
          </el-date-picker>
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">送出</el-button>
      <el-button @click="resetForm">清除</el-button>
    </el-form-item>
    <!-- <div>{{result.length}}</div> -->
  </el-form>
</template>

<script>
import {mapGetters} from 'vuex'
import {getDailyTimetable} from '@/api/thrs-api'

export default {
  data() {
    var validateArriveAndDeparture = (rule, value, callback) => {
      console.log('value:', value)
      if (this.form.fromStation === this.form.toStation) {
        callback(new Error('起訖站不可以相同'))
      } else {
        callback()
      }
    }
    return {
      form: {
        fromStation: '',
        toStation: '',
        arrive: false
      },
      rules: {
        fromStation: [
          { required: true, message: '請選擇出發站', trigger: 'change' },
          { validator: validateArriveAndDeparture, trigger: 'change' }
        ],
        toStation: [
          { required: true, message: '請選擇到達站', trigger: 'change' },
          { validator: validateArriveAndDeparture, trigger: 'change' }
        ],
        arrive: []
      },
      result: []
    }
  },
  computed: {
    ...mapGetters([
      'stations'
    ]),
    timeLabel() {
      return this.form.arrive ? '抵達時間' : '出發時間'
    }
  },
  watch: {
    'form.fromStation': function() {
      this.stationValidClear()
    },
    'form.toStation': function() {
      this.stationValidClear()
    }
  },
  mounted() {
    this.$store.dispatch('getStations')
  },
  methods: {
    stationValidClear() {
      this.$refs['form'].clearValidate(['fromStation', 'toStation'])
    },
    onSubmit() {
      // console.log('submit!', this.form)
      this.$refs['form'].validate((valid) => {
        if (valid) {
          // alert('submit!')
          this.getTimetable()
        } else {
          console.warn('error submit!!')
          return false
        }
      })
    },
    async getTimetable() {
      const params = {
        OriginStationID: this.form.fromStation,
        DestinationStationID: this.form.toStation,
        TrainDate: this.form.time.split(' ')[0] }
      this.result = await getDailyTimetable(params)
    },
    resetForm() {
      // console.log('clear', this.$refs['form'])
      this.$refs['form'].resetFields()
    },
    test() {
      console.log('test')
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
