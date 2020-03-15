<template>
  <el-container>
    <!-- <el-page-header @back="goBack" content="详情页面">
    </el-page-header> -->
    <el-header>高鐵查詢系統</el-header>

    <el-main>
      <el-tabs type="border-card">
        <el-tab-pane label="時間查詢">
          <byTime></byTime>
        </el-tab-pane>
        <el-tab-pane label="班次停靠站查詢">
          <byTrainNo></byTrainNo>
        </el-tab-pane>
        <el-tab-pane label="車站座位查詢">
          <byStation></byStation>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script>
// @ is an alias to /src
// import test from '@/components/test.vue'
import byTime from '@/components/byTime.vue'
import byTrainNo from '@/components/byTrainNo.vue'
import byStation from '@/components/byStation.vue'
export default {
  name: 'Home',
  components: {
    // test,
    byTime,
    byTrainNo,
    byStation
  },
  methods: {
    goBack() {
      console.log('go back')
    }
  }
}
</script>

<style lang="scss">
  .el-header {
    color: #fff;
    font-size: 1.5em;
    font-weight: 500;
  }
</style>
