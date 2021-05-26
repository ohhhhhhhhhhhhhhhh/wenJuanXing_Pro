// ==UserScript==
// @name         问卷星自动答题Pro（可设置偏好选项概率作答）
// @version      0.4.1
// @description 看注释。全自动填写问卷星问卷，支持自定义填空答案，最快可平均两三秒填写一份问卷，可多开几个标签同时填写，智能验证功能未实现，可能需要手动验证
// 2021.05.25 更新日志：可以设定普通单选题答案，提供随机选择和设定概率作答的方式；填空题可根据设定自动填写；支持自定义选择矩阵单选题；修复bug
// 已适配题型（Github源码参看/wenjuanxin.user.js，本脚本为修订版）
// 表格/矩阵选择题 - 单选
// 单选
// 填空 默认为空（需要设置）
// @author       Github_ohhhhhhhhh...
// @include     https://www.wjx.cn/jq/*.aspx
// @include     https://www.wjx.cn/m/*.aspx
// @include     https://www.wjx.cn/hj/*.aspx
// @include     https://www.wjx.cn/wjx/join/complete.aspx*
// @grant        none
// @namespace http://tampermonkey.net/
// ==/UserScript==

/*
 ⚠️
 ⚠️
 ⚠️
 ⚠️ 注意：问卷链接需要转换为以上*jq/yourId.aspx的形式，Id可在网页源码中查看到 ⚠️
 ⚠️
 ⚠️
 ⚠️
 */

(function() {
    'use strict';

    // 配置填空的答案项,如果不配置,默认填无
    /*
     var config = [
        {
            id: 3,//第三题:你每个月的生活费用是多少元？
            answer: [800,900,1000,1100,1500,2000]//随机选出一个答案
        },
        {
            id: 4,//第四题:你的生活费用来源是？
            answer: ["父母给","自己兼职","抢劫"]
        }
    ];
     */

    //答题结束，则打开新的问卷
    //https://www.wjx.cn/jq/111241047.aspx
    //https://www.wjx.cn/jq/118685348.aspx

    (function openNew() {
        var currentURL = window.location.href;
        var pat = /complete\.aspx\?activityid=(\d+)/;
        var obj = pat.exec(currentURL);
        if (obj) {
            window.location.href = "https://www.wjx.cn/jq/" + obj[1] + ".aspx";
        } else {
            console.log("not pat", obj);
        }
    })();


    var currentURL = window.location.href;
    //自动转为电脑网页版
    (function redirect() {
        try {
            var pat = /(https:\/\/www\.wjx\.cn\/)(jq|m)(.*)/g;
            var obj = pat.exec(currentURL);
            if (obj[2] == "m") {
                console.log("redirect now");
                window.location.href = obj[1] + "jq" + obj[3];
            } else {
                console.log("do!");
            }
        } catch (error) {}
    })();


    /**
     *
     *
     * @param {int} min The minimum value in the range
     * @param {int} max The maxmum value in the range
     * @return {int} Return Returns a random number within this range (both include)
     */
    function randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomArrayElements(arr, count) {
        var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(min);
    }


    /**
     * @description 该函数用于自动选择
     */
    function RandomChoose() {

        this.singleSlider = function(subject) {

            /**
             *
             * @param {int} _value 随机值
             * @param {*} min 可选的最小值
             * @param {*} max 可选的最大值
             * @param {*} subject 题目
             * @description 里面的_coordsX, _Number, getElCoordinate, 方法不用管，这是根据网页的方法复制下来的， 用来反模拟出clientX的值（即鼠标的值）, 因为网页上没有提供js直接修改的value，因此只能模拟鼠标时间来点击拉条，需要参数clientX。
             *
             */
            function getClientX(_value, min, max, subject) {
                var _bar = subject.querySelectorAll(".imageBar1")[0];
                var _slider = subject.querySelectorAll(".imageSlider1")[0]

                function _coordsX(x) {
                    x = _Number(x);
                    x = x <= _slider.offsetLeft ? _slider.offsetLeft : x >= _slider.offsetLeft + _slider.offsetWidth - _bar.offsetWidth ? _slider.offsetLeft + _slider.offsetWidth - _bar.offsetWidth : x;
                    return x;
                }

                function _Number(b) {
                    return isNaN(b) ? 0 : b;
                }

                function getElCoordinate(h) {
                    var e = h.offsetLeft;
                    while (h = h.offsetParent) {
                        e += h.offsetLeft;
                    }
                    return {
                        left: e,
                    };
                }

                var x = (_value - min) * ((_slider.offsetWidth - _bar.offsetWidth) / (max - min));
                x = _coordsX(x);
                var clientX = x + getElCoordinate(_slider).left + (_bar.offsetWidth / 2);
                return Math.round(clientX);
            }

            var max = Number(subject.querySelectorAll(".slider")[0].getAttribute("maxvalue"));
            var min = Number(subject.querySelectorAll(".slider")[0].getAttribute("minvalue"));
            //模拟鼠标点击的事件, 关键参数ClientX
            var evt = new MouseEvent("click", {
                clientX: getClientX(randint(min, max), min, max, subject),
                type: "click",
                __proto__: MouseEvent,
            });
            subject.querySelectorAll(".ruler")[0].dispatchEvent(evt);
        }
        
        this.singleStar = function(subject) {
            var list = subject.querySelectorAll("li:not([class='notchoice'])");
            list[randint(0, list.length - 1)].click();
        }
    }


    
    /**
     * 矩阵/表格单选题
     */
    
    //div2->与实际题号对应
    function martixSingle_2() { // 注意编号
        var q = document.getElementById("div2"); // 注意编号
        var tr = q.querySelectorAll("tbody > tr");
        for (var i = 0; i < tr.length; i++) {
            var td = tr[i].querySelectorAll("td");
            var items=[]; // 初始化，items为该函数域变量
            
            if(i==0){
                items = ['1','2','3','4'];
                td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
            }
            
            else if(i==1){ // 注意是else if；分支数量根据需求自行增删
                items = ['0','1','2'];
                td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
            }
            
            else{
                td[randint(0, td.length - 1)].click(); // 默认随机选择
            }
        }
    }
    martixSingle_2(); // 注意编号
    
    
    
    /*
     * 普通单选题
     */
    
    //div1->与实际题号对应
    function singleChoose_1(){ // 注意编号
        var q = document.getElementById("div1"); // 注意编号
        var list = q.querySelectorAll("li");
        var items=[]; // items列表初始化（函数域变量）
        
        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
                    
        /*
         *设定概率思路
         var obj1=randint(1, 20);
         if(obj1>8){
            // 此命令执行概率为60%
            items = ['1','2','3'];
            list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         else{
            // 此为40%
            items = ['0','4'];
            list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         */
                    
    }
 singleChoose_1(); // 注意编号
    
    
    
   
  

    /*
     *问卷提交部分
     */
            
    //滚动到提交按钮处
    try {
        var scrollvalue = document.getElementById("submit_button").offsetParent.offsetParent.offsetTop;
        window.scrollTo({
            top: scrollvalue,
            behavior: "smooth"
        });
    } catch (error) {}

})();
                            
window.alert = function(str) {
   location.reload();
   return ;
}

function myRandint(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//作答完之后延时提交
function timeSubmit(){
    var runTime=myRandint(210, 300); //设置随机作答时间为3.5-5min
    setTimeout(function(){
        // 延时runTime秒防止验证（事实上还是有智能验证）
        document.getElementById("submit_button").click();
        console.log("答题成功!");
    }, runTime*1000 ); // 样本量较小时，这样设置
    // 即，不要设置为这样：var runTime=myRandint(210000, 300000);
}
timeSubmit();

/*
//点击验证（模拟点击智能验证按键之后出现滑动验证（如下待完成），因此不建议开启）
var vertify_press = document.getElementById("SM_TXT_1");
vertify_press.click();
 */

/*待完成
//滑动验证
var vertify_drag = document.getElementById("nc_1_n1z");
*/

//手动验证之后网页链接已实现自动跳转，以下功能暂无需开启
/*
setTimeout(function(){
    // 6秒自动刷新,解决验证问题
    location.reload();
}, 6000 );
*/
