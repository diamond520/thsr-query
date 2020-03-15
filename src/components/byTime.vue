<template>
  <div>
    <el-form ref="form" :model="form" :rules="rules" label-width="80px">
      <el-row>
        <el-col :xs="24" :sm="12">
          <el-form-item label="出發站" prop="fromStation">
            <el-select v-model="form.fromStation" value-key="id" placeholder="出發站">
              <el-option
                v-for="(station) in stations"
                :key="station.id"
                :label="station.text"
                :value="station"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="到達站" prop="toStation">
            <el-select v-model="form.toStation" value-key="id" placeholder="到達站">
              <el-option
                v-for="(station) in stations"
                :key="station.id"
                :label="station.text"
                :value="station">
              </el-option>
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
    </el-form>
    <el-card v-if="timetable.length > 0" class="box-card">
      <div slot="header">
        {{form.fromStation.text}}
        <i class="el-icon-caret-right"></i>
        {{form.toStation.text}}
        <el-button style="float: right; padding: 3px" type="text" @click="next" :disabled="index + offset >= timetable.length">較晚班次</el-button>
        <el-button style="float: right; padding: 3px" type="text" @click="prev" :disabled="index <= 0">較早班次</el-button>
      </div>
      <div>
        <el-table
          empty-text="無資料"
          :data="tableData"
          stripe
          style="width: 100%">
          <el-table-column
            prop="DailyTrainInfo.TrainNo"
            label="車次"
            min-width="100px">
          </el-table-column>
          <el-table-column
            label="出發-抵達"
            min-width="150px">
            <template slot-scope="scope">
              <span>{{ `${scope.row.OriginStopTime.DepartureTime} - ${scope.row.DestinationStopTime.ArrivalTime}` }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="address"
            label="行車時間"
            min-width="100px">
            <template slot-scope="scope">
              <span>{{ diffTime(scope.row.OriginStopTime.DepartureTime, scope.row.DestinationStopTime.ArrivalTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
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
      timetable: [],
      index: 0,
      offset: 10
    }
  },
  computed: {
    ...mapGetters([
      'stations'
    ]),
    timeLabel() {
      return this.form.arrive ? '抵達時間' : '出發時間'
    },
    tableData() {
      return this.timetable.slice(this.index, this.index + this.offset)
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
    prev() {
      this.index -= this.offset
      this.index = this.index <= 0 ? 0 : this.index
    },
    next() {
      // this.index += this.offset
      this.index = (this.index + this.offset) > this.timetable.length ?  this.index : (this.index + this.offset)
    },
    diffTime(a, b) {
      a = new Date('1970/01/01 ' + a)
      b = new Date('1970/01/01 ' + b)
      const milliseconds = b - a;
      const minutes = milliseconds / (60000);
      const HH = Math.floor(minutes / 60)
      const mm = minutes - HH * 60
      return `${HH}:${mm > 10 ? mm : '0' + mm}`
    },
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
      const datetime = this.form.time.split(' ')
      const params = {
        OriginStationID: this.form.fromStation.id,
        DestinationStationID: this.form.toStation.id,
        TrainDate: datetime[0]
      }
      this.timetable = await getDailyTimetable(params)
      this.timetable.sort((a, b) => {
        if(this.form.arrive) {
          const aArrivalTime = new Date('1970/01/01 ' + a.DestinationStopTime.ArrivalTime)
          const bArrivalTime = new Date('1970/01/01 ' + b.DestinationStopTime.ArrivalTime)
          return aArrivalTime - bArrivalTime
        } else {
          const aDepartureTime = new Date('1970/01/01 ' + a.OriginStopTime.DepartureTime)
          const bDepartureTime = new Date('1970/01/01 ' + b.OriginStopTime.DepartureTime)
          return aDepartureTime - bDepartureTime
        }
      })
      this.index = this.timetable.findIndex(el => {
        if(this.form.arrive) {
          console.log('a')
          const expectTime = new Date('1970/01/01 ' + datetime[1])
          const arrivalTime = new Date('1970/01/01 ' + el.DestinationStopTime.ArrivalTime)
          return arrivalTime > expectTime
        } else {
          console.log('b', datetime[1], el.OriginStopTime.DepartureTime)
          const expectTime = new Date('1970/01/01 ' + datetime[1])
          const departureTime = new Date('1970/01/01 ' + el.OriginStopTime.DepartureTime)
          return departureTime > expectTime
        }
      })
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
