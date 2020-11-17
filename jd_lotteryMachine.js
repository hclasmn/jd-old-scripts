/*
京东抽奖机
更新时间：2020-11-15 15:08
脚本说明：三个抽奖活动，【新店福利】【闪购盲盒】【疯狂砸金蛋】，点通知只能跳转一个，入口在京东APP玩一玩里面可以看到
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东抽奖机
11 1 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js, tag=京东抽奖机, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jdlottery.png, enabled=true
// Loon
[Script]
cron "11 1 * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js,tag=京东抽奖机
// Surge
京东抽奖机 = type=cron,cronexp=11 1 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_lotteryMachine.js
 */
const $ = new Env('京东抽奖机');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const STRSPLIT = "|";
const needSum = false;     //是否需要显示汇总
const printDetail = false;        //是否显示出参详情
const appIdArr = ['1EFRQxA','1EFRRxA','1EFRQwA']
const shareCodeArr = ['P04z54XCjVXmIaW5m9cZ2f433tIlGWEga-IO2o','P04z54XCjVWmIaW5m9cZ2f433tIlJz4FjX2kfk','P04z54XCjVXnIaW5m9cZ2f433tIlLKXiUijZw4']
const funPrefixArr = ['','','','','','']
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
} else {
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}

const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`)
      initial();
      await  QueryJDUserInfo();
      if (!merge.enabled)  //cookie不可用
      {
        $.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i + 1} cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
        continue;
      }
      for (let j in appIdArr) {
        appId = appIdArr[j]
        shareCode = shareCodeArr[j]
        funPrefix = funPrefixArr[j]||'interact_template'
        if (parseInt(j)) console.log(`\n开始第${parseInt(j) + 1}个抽奖活动`)
        await interact_template_getHomeData();
      }
      await msgShow();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())


//获取昵称
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers : {
          'Referer' : `https://wqs.jd.com/my/iserinfo.html`,
          'Cookie' : cookie
        }
      }
      $.get(url, (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.retcode === 13) {
            merge.enabled = false
            return
          }
          merge.nickname = data.base.nickname;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}


function interact_template_getHomeData(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}`,
        headers : {
          'Origin' : `https://h5.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Referer' : `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`,
          'Host' : `api.m.jd.com`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=${funPrefix}_getHomeData&body={"appId":"${appId}","taskToken":""}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          data = JSON.parse(data);
          if (data.data.bizCode !== 0) {
            console.log(data.data.bizMsg);
            merge.jdBeans.fail++;
            merge.jdBeans.notify = `${data.data.bizMsg}`;
            return
          }
          scorePerLottery = data.data.result.userInfo.scorePerLottery||data.data.result.userInfo.lotteryMinusScore
          //console.log(scorePerLottery)
          for (let i = 0;i < data.data.result.taskVos.length;i ++) {
            console.log("\n" + data.data.result.taskVos[i].taskType + '-' + data.data.result.taskVos[i].taskName  + '-' + (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : "全部已完成"))
            //签到
            if ([0,13].includes(data.data.result.taskVos[i].taskType)) {
              if (data.data.result.taskVos[i].status === 1) {
                await harmony_collectScore(data.data.result.taskVos[i].simpleRecordInfoVo.taskToken,data.data.result.taskVos[i].taskId);
              }
              continue
            }
            if (data.data.result.taskVos[i].taskType === 14) {//'data.data.result.taskVos[i].assistTaskDetailVo.taskToken'
              await harmony_collectScore(shareCode,data.data.result.taskVos[i].taskId);
              continue
            }
            let list = data.data.result.taskVos[i].productInfoVos || data.data.result.taskVos[i].followShopVo || data.data.result.taskVos[i].shoppingActivityVos || data.data.result.taskVos[i].browseShopVo
            for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
              for (let j in list) {
                if (list[j].status === 1) {
                  //console.log(list[j].simpleRecordInfoVo||list[j].assistTaskDetailVo)
                  console.log("\n" + (list[j].title || list[j].shopName||list[j].skuName))
                  await harmony_collectScore(list[j].taskToken,data.data.result.taskVos[i].taskId);
                  list[j].status = 2;
                  break;
                } else {
                  continue;
                }
              }
            }
          }
          await interact_template_getLotteryResult();
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}


function harmony_collectScore(taskToken,taskId,timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}`,
        headers : {
          'Origin' : `https://h5.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Referer' : `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`,//?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ?inviteId=${shareCode}
          'Host' : `api.m.jd.com`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=${funPrefix === 'interact_template' ? 'harmony' : funPrefix}_collectScore&body={"appId":"${appId}","taskToken":"${taskToken}","taskId":${taskId},"actionType":0}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url)
      $.post(url, async (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          data = JSON.parse(data);
          console.log(data.data.bizMsg)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//
function interact_template_getLotteryResult(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}`,
        headers : {
          'Origin' : `https://h5.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Referer' : `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`,//?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ
          'Host' : `api.m.jd.com`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=${funPrefix}_getLotteryResult&body={"appId":"${appId}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          if (!timeout) console.log('\n开始抽奖')
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            merge.jdBeans.success++;
            if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
              console.log('京豆:' + data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity)
              merge.jdBeans.prizeCount += parseInt(data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity)
            }
            if (parseInt(data.data.result.userScore) >= scorePerLottery ) {
              await interact_template_getLotteryResult(1000)
            }
          } else{
            merge.jdBeans.fail++;
            console.log(data.data.bizMsg)
            if (data.data.bizCode === 111 ) data.data.bizMsg = "无机会"
            merge.jdBeans.notify = `${data.data.bizMsg}`;
          }

        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//初始化
function initial() {
  merge = {
    nickname: "",
    enabled: true,
    //blueCoin: {prizeDesc : "收取|蓝币|个",number : true},  //定义 动作|奖励名称|奖励单位   是否是数字
    jdBeans: {prizeDesc : "抽得|京豆|个",number : true,fixed : 0}
  }
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = "";
    merge[i].show = true;
  }
  //merge.jdBeans.show =Boolean(coinToBeans);
}
//通知
function msgShow() {
  let message = "";
  let url ={ "open-url" : `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/YgnrqBaEmVHWppzCgW8zjZj3VjV/index.html%22%20%7D`}
  let title = `京东账号：${merge.nickname}`;
  for (let i in merge) {
    if (typeof (merge[i]) !== "object" || !merge[i].show) continue;
    if (merge[i].notify.split("").reverse()[0] === "\n") merge[i].notify = merge[i].notify.substr(0,merge[i].notify.length - 1);
    message += `${merge[i].prizeDesc.split(STRSPLIT)[0]}${merge[i].prizeDesc.split(STRSPLIT)[1]}：` + (merge[i].success ? `${merge[i].prizeCount.toFixed(merge[i].fixed)}${merge[i].prizeDesc.split(STRSPLIT)[2]}\n` : `失败：${merge[i].notify}\n`)
  }
//合计
  if (needSum)
  {
    $.sum = {};
    for (let i in merge) {
      if (typeof (merge[i]) !== "object" || !merge[i].show) continue;
      if (typeof ($.sum[merge[i].prizeDesc.split(STRSPLIT)[1]]) === "undefined")  $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]] = {count : 0};
      $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]].count += merge[i].prizeCount;
    }
    message += `合计：`
    for (let i in $.sum)
    {
      message += `${$.sum[i].count.toFixed($.sum[i].fixed)}${i}，`
    }
  }
  message += `请点击通知跳转至APP查看`
  //message = message.substr(0,message.length - 1);
  $.msg($.name, title, message, url);
}

