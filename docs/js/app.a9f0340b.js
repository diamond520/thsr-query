(function(t){function e(e){for(var n,i,l=e[0],s=e[1],u=e[2],c=0,f=[];c<l.length;c++)i=l[c],Object.prototype.hasOwnProperty.call(a,i)&&a[i]&&f.push(a[i][0]),a[i]=0;for(n in s)Object.prototype.hasOwnProperty.call(s,n)&&(t[n]=s[n]);m&&m(e);while(f.length)f.shift()();return o.push.apply(o,u||[]),r()}function r(){for(var t,e=0;e<o.length;e++){for(var r=o[e],n=!0,i=1;i<r.length;i++){var s=r[i];0!==a[s]&&(n=!1)}n&&(o.splice(e--,1),t=l(l.s=r[0]))}return t}var n={},a={app:0},o=[];function i(t){return l.p+"js/"+({about:"about"}[t]||t)+"."+{about:"e29f1527"}[t]+".js"}function l(e){if(n[e])return n[e].exports;var r=n[e]={i:e,l:!1,exports:{}};return t[e].call(r.exports,r,r.exports,l),r.l=!0,r.exports}l.e=function(t){var e=[],r=a[t];if(0!==r)if(r)e.push(r[2]);else{var n=new Promise((function(e,n){r=a[t]=[e,n]}));e.push(r[2]=n);var o,s=document.createElement("script");s.charset="utf-8",s.timeout=120,l.nc&&s.setAttribute("nonce",l.nc),s.src=i(t);var u=new Error;o=function(e){s.onerror=s.onload=null,clearTimeout(c);var r=a[t];if(0!==r){if(r){var n=e&&("load"===e.type?"missing":e.type),o=e&&e.target&&e.target.src;u.message="Loading chunk "+t+" failed.\n("+n+": "+o+")",u.name="ChunkLoadError",u.type=n,u.request=o,r[1](u)}a[t]=void 0}};var c=setTimeout((function(){o({type:"timeout",target:s})}),12e4);s.onerror=s.onload=o,document.head.appendChild(s)}return Promise.all(e)},l.m=t,l.c=n,l.d=function(t,e,r){l.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},l.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},l.t=function(t,e){if(1&e&&(t=l(t)),8&e)return t;if(4&e&&"object"===typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(l.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)l.d(r,n,function(e){return t[e]}.bind(null,n));return r},l.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return l.d(e,"a",e),e},l.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},l.p="/",l.oe=function(t){throw console.error(t),t};var s=window["webpackJsonp"]=window["webpackJsonp"]||[],u=s.push.bind(s);s.push=e,s=s.slice();for(var c=0;c<s.length;c++)e(s[c]);var m=u;o.push([0,"chunk-vendors"]),r()})({0:function(t,e,r){t.exports=r("56d7")},"21bb":function(t,e,r){"use strict";var n=r("2dad"),a=r.n(n);a.a},"2dad":function(t,e,r){},3963:function(t,e,r){},"56d7":function(t,e,r){"use strict";r.r(e);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),a=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{attrs:{id:"app"}},[r("router-view")],1)},o=[],i=(r("5c0b"),r("2877")),l={},s=Object(i["a"])(l,a,o,!1,null,null,null),u=s.exports,c=(r("d3b7"),r("8c4f")),m=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("el-container",[r("el-header",[t._v("高鐵查詢系統")]),r("el-main",[r("el-tabs",{attrs:{type:"border-card"}},[r("el-tab-pane",{attrs:{label:"時間查詢"}},[r("byTime")],1),r("el-tab-pane",{attrs:{label:"班次停靠站查詢"}},[r("byTrainNo")],1),r("el-tab-pane",{attrs:{label:"車站座位查詢"}},[r("byStation")],1)],1)],1)],1)},f=[],d=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",[r("el-form",{ref:"form",attrs:{model:t.form,rules:t.rules,"label-width":"80px"}},[r("el-row",[r("el-col",{attrs:{xs:24,sm:12}},[r("el-form-item",{attrs:{label:"出發站",prop:"fromStation"}},[r("el-select",{attrs:{"value-key":"id",placeholder:"出發站"},model:{value:t.form.fromStation,callback:function(e){t.$set(t.form,"fromStation",e)},expression:"form.fromStation"}},t._l(t.stations,(function(t){return r("el-option",{key:t.id,attrs:{label:t.text,value:t}})})),1)],1)],1),r("el-col",{attrs:{xs:24,sm:12}},[r("el-form-item",{attrs:{label:"到達站",prop:"toStation"}},[r("el-select",{attrs:{"value-key":"id",placeholder:"到達站"},model:{value:t.form.toStation,callback:function(e){t.$set(t.form,"toStation",e)},expression:"form.toStation"}},t._l(t.stations,(function(t){return r("el-option",{key:t.id,attrs:{label:t.text,value:t}})})),1)],1)],1),r("el-col",{attrs:{span:24}},[r("el-form-item",{attrs:{label:"出發時間",prop:"arrive"}},[r("el-switch",{attrs:{"active-text":"抵達時間","inactive-color":"#13ce66","inactive-text":""},model:{value:t.form.arrive,callback:function(e){t.$set(t.form,"arrive",e)},expression:"form.arrive"}})],1)],1),r("el-col",{attrs:{span:24}},[r("el-form-item",{attrs:{label:t.timeLabel,prop:"time"}},[r("el-date-picker",{attrs:{type:"datetime",format:"yyyy-MM-dd HH:mm","value-format":"yyyy-MM-dd HH:mm",placeholder:t.timeLabel},model:{value:t.form.time,callback:function(e){t.$set(t.form,"time",e)},expression:"form.time"}},[r("el-button",{attrs:{slot:"append",icon:"el-icon-search"},slot:"append"})],1)],1)],1)],1),r("el-form-item",[r("el-button",{attrs:{type:"primary"},on:{click:t.onSubmit}},[t._v("送出")]),r("el-button",{on:{click:t.resetForm}},[t._v("清除")])],1)],1),t.timetable.length>0?r("el-card",{staticClass:"box-card"},[r("div",{attrs:{slot:"header"},slot:"header"},[t._v(" "+t._s(t.form.fromStation.text)+" "),r("i",{staticClass:"el-icon-caret-right"}),t._v(" "+t._s(t.form.toStation.text)+" "),r("el-button",{staticStyle:{float:"right",padding:"3px"},attrs:{type:"text",disabled:t.index+t.offset>=t.timetable.length},on:{click:t.next}},[t._v("較晚班次")]),r("el-button",{staticStyle:{float:"right",padding:"3px"},attrs:{type:"text",disabled:t.index<=0},on:{click:t.prev}},[t._v("較早班次")])],1),r("div",[r("el-table",{staticStyle:{width:"100%"},attrs:{"empty-text":"無資料",data:t.tableData,stripe:""}},[r("el-table-column",{attrs:{prop:"DailyTrainInfo.TrainNo",label:"車次","min-width":"100px"}}),r("el-table-column",{attrs:{label:"出發-抵達","min-width":"150px"},scopedSlots:t._u([{key:"default",fn:function(e){return[r("span",[t._v(t._s(e.row.OriginStopTime.DepartureTime+" - "+e.row.DestinationStopTime.ArrivalTime))])]}}],null,!1,946627556)}),r("el-table-column",{attrs:{prop:"address",label:"行車時間","min-width":"100px"},scopedSlots:t._u([{key:"default",fn:function(e){return[r("span",[t._v(t._s(t.diffTime(e.row.OriginStopTime.DepartureTime,e.row.DestinationStopTime.ArrivalTime)))])]}}],null,!1,2955018076)})],1)],1)]):t._e()],1)},p=[],b=(r("99af"),r("c740"),r("fb6a"),r("ac1f"),r("1276"),r("96cf"),r("1da1")),v=r("5530"),h=r("2f62"),g=r("bc3a"),S=r.n(g),w=r("5c96"),x=r.n(w),y="https://ptx.transportdata.tw/MOTC/v2/Rail/THSR",T=S.a.create({baseURL:y,timeout:5e3});T.interceptors.request.use((function(t){return t}),(function(t){return console.warn(t),Promise.reject(t)})),T.interceptors.response.use((function(t){var e=t.data;return 200!==t.status?(Object(w["Message"])({message:e.message||"Error",type:"error",duration:5e3}),Promise.reject(new Error(e.message||"Error"))):t.data}),(function(t){return console.warn("err"+t),Object(w["Message"])({message:t.message,type:"error",duration:5e3}),Promise.reject(t)}));var _=T;function k(){return _({url:"/Station",method:"get"})}function O(t){var e=t.OriginStationID,r=t.DestinationStationID,n=t.TrainDate;return _({url:"/DailyTimetable/OD/".concat(e,"/to/").concat(r,"/").concat(n),method:"get"})}function D(){return _({url:"/GeneralTimetable?top=300",method:"get"})}function j(t){return _({url:"/GeneralTimetable/TrainNo/".concat(t,"?top=1"),method:"get"})}function N(t){return _({url:"/AvailableSeatStatusList/".concat(t),method:"get"})}var $={data:function(){var t=this,e=function(e,r,n){t.form.fromStation===t.form.toStation?n(new Error("起訖站不可以相同")):n()};return{form:{fromStation:"",toStation:"",arrive:!1},rules:{fromStation:[{required:!0,message:"請選擇出發站",trigger:"change"},{validator:e,trigger:"change"}],toStation:[{required:!0,message:"請選擇到達站",trigger:"change"},{validator:e,trigger:"change"}],arrive:[]},timetable:[],index:0,offset:10}},computed:Object(v["a"])({},Object(h["b"])(["stations"]),{timeLabel:function(){return this.form.arrive?"抵達時間":"出發時間"},tableData:function(){return this.timetable.slice(this.index,this.index+this.offset)}}),watch:{"form.fromStation":function(){this.stationValidClear()},"form.toStation":function(){this.stationValidClear()}},mounted:function(){this.$store.dispatch("getStations")},methods:{prev:function(){this.index-=this.offset,this.index=this.index<=0?0:this.index},next:function(){this.index=this.index+this.offset>this.timetable.length?this.index:this.index+this.offset},diffTime:function(t,e){t=new Date("1970/01/01 "+t),e=new Date("1970/01/01 "+e);var r=e-t,n=r/6e4,a=Math.floor(n/60),o=n-60*a;return"".concat(a,":").concat(o>10?o:"0"+o)},stationValidClear:function(){this.$refs["form"].clearValidate(["fromStation","toStation"])},onSubmit:function(){var t=this;this.$refs["form"].validate((function(e){if(!e)return console.warn("error submit!!"),!1;t.getTimetable()}))},getTimetable:function(){var t=this;return Object(b["a"])(regeneratorRuntime.mark((function e(){var r,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=t.form.time.split(" "),n={OriginStationID:t.form.fromStation.id,DestinationStationID:t.form.toStation.id,TrainDate:r[0]},e.next=4,O(n);case 4:t.timetable=e.sent,t.timetable.sort((function(e,r){if(t.form.arrive){var n=new Date("1970/01/01 "+e.DestinationStopTime.ArrivalTime),a=new Date("1970/01/01 "+r.DestinationStopTime.ArrivalTime);return n-a}var o=new Date("1970/01/01 "+e.OriginStopTime.DepartureTime),i=new Date("1970/01/01 "+r.OriginStopTime.DepartureTime);return o-i})),t.index=t.timetable.findIndex((function(e){if(t.form.arrive){var n=new Date("1970/01/01 "+r[1]),a=new Date("1970/01/01 "+e.DestinationStopTime.ArrivalTime);return a>n}var o=new Date("1970/01/01 "+r[1]),i=new Date("1970/01/01 "+e.OriginStopTime.DepartureTime);return i>o}));case 7:case"end":return e.stop()}}),e)})))()},resetForm:function(){this.$refs["form"].resetFields()}}},R=$,A=Object(i["a"])(R,d,p,!1,null,"0d6cd263",null),E=A.exports,M=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",[r("el-form",{ref:"form",attrs:{model:t.form,"label-width":"80px"}},[r("el-form-item",{attrs:{label:"車次",prop:"trainNo",rules:t.rules}},[r("el-select",{attrs:{filterable:"","allow-create":!0,"no-data-text":"暫無車次","no-match-text":"查無車次",placeholder:"輸入車次","remote-method":t.getTimetable},model:{value:t.form.trainNo,callback:function(e){t.$set(t.form,"trainNo",e)},expression:"form.trainNo"}},t._l(t.trainOptions,(function(t){return r("el-option",{key:t,attrs:{label:t,value:t}})})),1)],1),r("el-form-item",[r("el-button",{attrs:{type:"primary"},on:{click:t.onSubmit}},[t._v("送出")])],1)],1),t.timetable.TrainNo?r("el-card",[r("div",{staticClass:"clearfix",attrs:{slot:"header"},slot:"header"},[t._v(" "+t._s("車次："+t.timetable.TrainNo)+" ")]),t.timetable.Stops?r("el-timeline",t._l(t.timetable.Stops,(function(e,n){return r("el-timeline-item",{key:n,attrs:{type:"primary",timestamp:e.DepartureTime}},[t._v(" "+t._s(e.StationName.Zh_tw)+" ")])})),1):r("div",[t._v(t._s("查無車次資料"))])],1):t._e()],1)},P=[],L=(r("d81d"),{data:function(){return{form:{trainNo:""},rules:{required:!0,message:"請輸入車次",trigger:"blur"},trainOptions:[],timetable:{}}},mounted:function(){this.getTimetable()},methods:{getTimetable:function(){var t=this;return Object(b["a"])(regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,D();case 2:r=e.sent,t.trainOptions=r.map((function(t){return t.GeneralTimetable.GeneralTrainInfo.TrainNo}));case 4:case"end":return e.stop()}}),e)})))()},getTimetablebyTrainNo:function(){var t=this;return Object(b["a"])(regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,j(t.form.trainNo);case 2:if(r=e.sent,0!==r.length){e.next=6;break}return t.timetable={TrainNo:t.form.trainNo},e.abrupt("return");case 6:t.timetable={TrainNo:r[0].GeneralTimetable.GeneralTrainInfo.TrainNo,Stops:r[0].GeneralTimetable.StopTimes};case 7:case"end":return e.stop()}}),e)})))()},onSubmit:function(){var t=this;this.$refs["form"].validate((function(e){if(!e)return console.warn("error submit!!"),!1;t.getTimetablebyTrainNo()}))}}}),C=L,I=Object(i["a"])(C,M,P,!1,null,"3087ad1f",null),G=I.exports,H=function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",[r("el-form",{ref:"form",attrs:{model:t.form,rules:t.rules,"label-width":"80px"}},[r("el-form-item",{attrs:{label:"車站",prop:"station"}},[r("el-select",{attrs:{placeholder:"選擇車站","value-key":"id"},model:{value:t.form.station,callback:function(e){t.$set(t.form,"station",e)},expression:"form.station"}},t._l(t.stations,(function(t){return r("el-option",{key:t.id,attrs:{label:t.text,value:t}})})),1)],1),r("el-form-item",[r("el-button",{attrs:{type:"primary"},on:{click:t.onSubmit}},[t._v("送出")])],1)],1),r("el-card",[r("el-tabs",{model:{value:t.activeName,callback:function(e){t.activeName=e},expression:"activeName"}},[r("el-tab-pane",{attrs:{label:"北上("+t.northward.length+")",name:"north"}}),r("el-tab-pane",{attrs:{label:"南下("+t.southward.length+")",name:"south"}})],1),r("el-table",{staticStyle:{width:"100%"},attrs:{data:"north"===t.activeName?t.northward:t.southward,"row-class-name":"success-row"}},[r("el-table-column",{attrs:{type:"expand"},scopedSlots:t._u([{key:"default",fn:function(e){return[r("el-table",{attrs:{data:e.row.StopStations}},[r("el-table-column",{attrs:{label:"前往",prop:"StationName.Zh_tw"}}),r("el-table-column",{attrs:{label:"標準席"},scopedSlots:t._u([{key:"default",fn:function(e){return[r("span",[t._v(" "+t._s(t._f("seatAvailable")(e.row.StandardSeatStatus))+" ")])]}}],null,!0)}),r("el-table-column",{attrs:{label:"商務席"},scopedSlots:t._u([{key:"default",fn:function(e){return[r("span",[t._v(" "+t._s(t._f("seatAvailable")(e.row.BusinessSeatStatus))+" ")])]}}],null,!0)})],1)]}}])}),r("el-table-column",{attrs:{label:"車次",prop:"TrainNo"}})],1)],1)],1)},q=[],F=(r("4de4"),{data:function(){return{activeName:"north",form:{station:{},trainNo:""},rules:{required:!0,message:"請輸入車站",trigger:"blur"},availableSeats:[],direction:{northward:{value:1,text:"北上"},southward:{value:0,text:"南下"}}}},filters:{seatAvailable:function(t){console.log("value",t);var e="";switch(t){case"Available":e="尚有座位";break;case"Limited":e="座位有限";break;case"Full":e="已無座位";break;default:break}return e}},computed:Object(v["a"])({},Object(h["b"])(["stations"]),{northward:function(){return this.availableSeats.filter((function(t){return 1===t.Direction}))},southward:function(){return this.availableSeats.filter((function(t){return 0===t.Direction}))}}),methods:{onSubmit:function(){var t=this;this.$refs["form"].validate((function(e){if(!e)return console.warn("error submit!!"),!1;t.getSeatStatusList()}))},getSeatStatusList:function(){var t=this;return Object(b["a"])(regeneratorRuntime.mark((function e(){var r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,N(t.form.station.id);case 2:r=e.sent,t.availableSeats=r,console.log("result",r);case 5:case"end":return e.stop()}}),e)})))()}}}),V=F,Z=(r("968d"),Object(i["a"])(V,H,q,!1,null,null,null)),J=Z.exports,B={name:"Home",components:{byTime:E,byTrainNo:G,byStation:J},methods:{}},U=B,z=(r("21bb"),Object(i["a"])(U,m,f,!1,null,null,null)),K=z.exports;n["default"].use(c["a"]);var Q=[{path:"/",name:"Home",component:K},{path:"/about",name:"About",component:function(){return r.e("about").then(r.bind(null,"f820"))}}],W=new c["a"]({mode:"history",base:"/",routes:Q}),X=W;n["default"].use(h["a"]);var Y=new h["a"].Store({state:{stations:[]},mutations:{setStations:function(t,e){t.stations=e}},actions:{getStations:function(t){var e=t.commit;return Object(b["a"])(regeneratorRuntime.mark((function t(){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,k();case 2:r=t.sent,e("setStations",r);case 4:case"end":return t.stop()}}),t)})))()}},getters:{stations:function(t){return t.stations.map((function(t){return{text:t.StationName.Zh_tw,id:t.StationID}}))}},modules:{}});r("f5df1"),r("73ec"),r("0fae");n["default"].use(x.a),n["default"].config.productionTip=!1,new n["default"]({router:X,store:Y,render:function(t){return t(u)}}).$mount("#app")},"5c0b":function(t,e,r){"use strict";var n=r("9c0c"),a=r.n(n);a.a},"73ec":function(t,e,r){},"968d":function(t,e,r){"use strict";var n=r("3963"),a=r.n(n);a.a},"9c0c":function(t,e,r){}});
//# sourceMappingURL=app.a9f0340b.js.map