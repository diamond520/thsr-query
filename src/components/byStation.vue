<template>
  <div>
    <el-form ref="form" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="車站" prop="station">
        <el-select
          v-model="form.station"
          placeholder="選擇車站"
          value-key="id">
          <el-option
            v-for="(station) in stations"
            :key="station.id"
            :label="station.text"
            :value="station"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">送出</el-button>
      </el-form-item>
    </el-form>
    <el-card>
      <el-tabs v-model="activeName">
        <el-tab-pane :label="`北上(${northward.length})`" name="north"></el-tab-pane>
        <el-tab-pane :label="`南下(${southward.length})`" name="south"></el-tab-pane>
      </el-tabs>
      <el-table
        :data="activeName === 'north' ? northward : southward"
        style="width: 100%"
        row-class-name="success-row">
        <el-table-column type="expand">
          <template slot-scope="props">
            <el-table :data="props.row.StopStations">
              <el-table-column
                label="前往"
                prop="StationName.Zh_tw">
              </el-table-column>
              <el-table-column label="標準席">
                <template slot-scope="scope">
                  <span>
                    {{ scope.row.StandardSeatStatus | seatAvailable }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="商務席">
                <template slot-scope="scope">
                  <span>
                    {{ scope.row.BusinessSeatStatus | seatAvailable }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <!-- <el-form label-position="left" class="demo-table-expand">
              <el-form-item
                v-for="(station, i) in props.row.StopStations"
                :key="i"
                label="前往">
                <span>{{ station.StationName.Zh_tw }}；</span>
                <span>標準席：{{ station.StandardSeatStatus | seatAvailable }}；</span>
                <span>商務席：{{ station.BusinessSeatStatus | seatAvailable }}</span>
              </el-form-item>
            </el-form> -->
          </template>
        </el-table-column>
        <el-table-column
          label="車次"
          prop="TrainNo">
        </el-table-column>
        <!-- <el-table-column
          label="商品名称"
          prop="name">
        </el-table-column>
        <el-table-column
          label="描述"
          prop="desc">
        </el-table-column> -->
      </el-table>
    </el-card>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
// import {getAvailableSeatStatusList} from '@/api/thrs-api'
import json from './res'

export default {
  data() {
    return {
      activeName: 'north',
      form: {
        station: {},
        trainNo: ''
      },
      rules: {
        required: true,
        message: '請輸入車站',
        trigger: 'blur'
      },
      availableSeats: [],
      direction: {
        northward: {
          value: 1,
          text: '北上'
        },
        southward: {
          value: 0,
          text: '南下'
        }
      }
    }
  },
  filters: {
    seatAvailable: function(value) {
      console.log('value', value)
      let reVal = ''
      switch(value) {
        case 'Available':
          reVal = '尚有座位'
          break
        case 'Limited':
          reVal = '座位有限'
          break
        case 'Full':
          reVal = '已無座位'
          break
        default:
          break
      }
      return reVal
    }
  },
  computed: {
    ...mapGetters([
      'stations'
    ]),
    northward() {
      return this.availableSeats.filter(item => item.Direction === 1)
    },
    southward() {
      return this.availableSeats.filter(item => item.Direction === 0)
    }
  },
  methods: {
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          // alert('submit!')
          this.getSeatStatusList()
        } else {
          console.warn('error submit!!')
          return false
        }
      })
    },
    async getSeatStatusList() {
      const result = await getAvailableSeatStatusList(this.form.station.id)
      // const result = json[0].AvailableSeats
      this.availableSeats = result
      console.log('result', result)
    }
  }
}
</script>

<style lang="scss" >
.el-table .success-row {
  background: #ecf5ff;
}
</style>
