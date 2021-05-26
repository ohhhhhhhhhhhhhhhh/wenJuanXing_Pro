// ==UserScript==
// @name         问卷星自动答题
// @version      21.05.25
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
            var obj2;

            if(i==0){
                items = ['0'];
                td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
            }

            else if(i==1){ // 注意是else if；分支数量根据需求自行增删
                items = ['0','1'];
                td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
            }

            else if(i==2){
                    obj2=randint(1, 20);
                    if(obj2>8){
                        items = ['1','2','3'];
                        td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                    }
                    else{
                        items = ['0','4'];
                        td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                    }
            }

            else if(i==4){
                items = ['3','4'];
                td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
            }

            else{
                td[randint(0, td.length - 1)].click(); // 默认随机选择
            }
        }
    }
    martixSingle_2(); // 注意编号

                   //div3->与实际题号对应
                   function martixSingle_3() { // 注意编号
                       var q = document.getElementById("div3"); // 注意编号
                       var tr = q.querySelectorAll("tbody > tr");
                       for (var i = 0; i < tr.length; i++) {
                           var td = tr[i].querySelectorAll("td");
                           var items=[]; // 初始化，items为该函数域变量
                           var obj3;

                           if(i==0){
                               items = ['0'];
                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                           }

                           else if(i==1){ // 注意是else if；分支数量根据需求自行增删
                               items = ['0','1'];
                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                           }

                                  else if(i==2){
                                      items = ['0','1','2'];
                                      td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                  }

                                         else if(i==3){
                                             items = ['3','4'];
                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                         }
                                                else if(i==6){
                                                    items = ['0','1','2'];
                                                    td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                }

                           else if(i==7){
                                   obj3=randint(1, 20);
                                   if(obj3>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else{
                               td[randint(0, td.length - 1)].click(); // 默认随机选择
                           }
                       }
                   }
                   martixSingle_3(); // 注意编号

                                                       //div8->与实际题号对应
                                                       function martixSingle_8() { // 注意编号
                                                           var q = document.getElementById("div8"); // 注意编号
                                                           var tr = q.querySelectorAll("tbody > tr");
                                                           for (var i = 0; i < tr.length; i++) {
                                                               var td = tr[i].querySelectorAll("td");
                                                               var items=[]; // 初始化，items为该函数域变量
                                                               var obj8;

                                                               if(i==0){
                                                                   obj8=randint(1, 20);
                                                                   if(obj8>5){
                                                                       items = ['1','2','3','4'];
                                                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                   }
                                                                   else{
                                                                       items = ['0','4'];
                                                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                   }
                                                               }

                                                               else if(i==1){ // 注意是else if；分支数量根据需求自行增删
                                                                   items = ['3','4'];
                                                                   td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                               }
                                                                      else if(i==2){
                                                                          items = ['3','4'];
                                                                          td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                      }

                                                               else if(i==3){
                                                                       obj8=randint(1, 20);
                                                                       if(obj8>8){
                                                                           items = ['1','2','3'];
                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                       }
                                                                       else{
                                                                           items = ['0','4'];
                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                       }
                                                               }

                                                                             else if(i==4){
                                                                                     obj8=randint(1, 20);
                                                                                     if(obj8>10){
                                                                                         items = ['1','2','3'];
                                                                                         td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                     }
                                                                                     else{
                                                                                         items = ['0','1','3','4'];
                                                                                         td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                     }
                                                                             }

                                                               else if(i==5){
                                                                   items = ['2','3','4'];
                                                                   td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                               }
                                                                      else if(i==6){
                                                                          items = ['3','4'];
                                                                          td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                      }
                                                                             else if(i==7){
                                                                                     obj8=randint(1, 20);
                                                                                     if(obj8>17){
                                                                                         items = ['0','1','2','3'];
                                                                                         td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                     }
                                                                                     else{
                                                                                         items = ['3','4'];
                                                                                         td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                     }
                                                                             }

                                                                             else if(i==8){
                                                                                 items = ['3','4'];
                                                                                 td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                             }
                                                                                    else if(i==9){
                                                                                        items = ['3','4'];
                                                                                        td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                    }

                                                               else{
                                                                   td[randint(0, td.length - 1)].click(); // 默认随机选择
                                                               }
                                                           }
                                                       }
                                                       martixSingle_8(); // 注意编号

                                                                                           //div9->与实际题号对应
                                                                                           function martixSingle_9() { // 注意编号
                                                                                               var q = document.getElementById("div9"); // 注意编号
                                                                                               var tr = q.querySelectorAll("tbody > tr");
                                                                                               for (var i = 0; i < tr.length; i++) {
                                                                                                   var td = tr[i].querySelectorAll("td");
                                                                                                   var items=[]; // 初始化，items为该函数域变量
                                                                                                   var obj9;

                                                                                                   if(i==0){
                                                                                                       obj9=randint(1, 20);
                                                                                                       if(obj9>4){
                                                                                                           items = ['1','2','3'];
                                                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                       }
                                                                                                       else{
                                                                                                           items = ['0','4'];
                                                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                       }
                                                                                                   }

                                                                                                   else if(i==1){
                                                                                                       obj9=randint(1, 20);
                                                                                                       if(obj9>4){
                                                                                                           items = ['1','2','3'];
                                                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                       }
                                                                                                       else{
                                                                                                           items = ['0','4'];
                                                                                                           td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                       }
                                                                                                   }

                                                                                                   else if(i==2){
                                                                                                           obj9=randint(1, 20);
                                                                                                           if(obj9>2){
                                                                                                               items = ['1','2','3'];
                                                                                                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                           }
                                                                                                           else{
                                                                                                               items = ['0','4'];
                                                                                                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                           }
                                                                                                   }

                                                                                                                 else if(i==3){
                                                                                                                         obj9=randint(1, 20);
                                                                                                                         if(obj9>4){
                                                                                                                             items = ['2','3','4'];
                                                                                                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                                         }
                                                                                                                         else{
                                                                                                                             items = ['3','4'];
                                                                                                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                                         }
                                                                                                                 }

                                                                                                   else if(i==4){
                                                                                                       items = ['3','4'];
                                                                                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                   }
                                                                                                          else if(i==5){
                                                                                                              items = ['2','3','4'];
                                                                                                              td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                                                                          }
                                                                                                   else{
                                                                                                       td[randint(0, td.length - 1)].click(); // 默认随机选择
                                                                                                   }
                                                                                               }
                                                                                           }
                                                                                           martixSingle_9(); // 注意编号

//div10->与实际题号对应
                   function martixSingle_10() { // 注意编号
                       var q = document.getElementById("div10"); // 注意编号
                       var tr = q.querySelectorAll("tbody > tr");
                       for (var i = 0; i < tr.length; i++) {
                           var td = tr[i].querySelectorAll("td");
                           var items=[]; // 初始化，items为该函数域变量
                           var obj10;

                           if(i==0){
                               items = ['2','3','4'];
                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                           }

                           else if(i==1){ // 注意是else if；分支数量根据需求自行增删
                               items = ['2','3','4'];
                               td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                           }

                                  else if(i==2){
                                      items = ['3','4'];
                                      td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                  }

                                         else if(i==3){
                                             items = ['3','4'];
                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                         }
					else if(i==4){
                                             items = ['3','4'];
                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                         }
else if(i==5){
                                             items = ['3','4'];
                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                         }
else if(i==6){
                                   obj10=randint(1, 20);
                                   if(obj10>4){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }


                                                else if(i==7){
                                                    items = ['2','3','4'];
                                                    td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                }

                           else if(i==8){
                                   obj10=randint(1, 20);
                                   if(obj10>8){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj10>2){
                                       items = ['1','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['1','0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else{
                               td[randint(0, td.length - 1)].click(); // 默认随机选择
                           }
                       }
                   }
                   martixSingle_10(); // 注意编号


//div11->与实际题号对应
                   function martixSingle_11() { // 注意编号
                       var q = document.getElementById("div11"); // 注意编号
                       var tr = q.querySelectorAll("tbody > tr");
                       for (var i = 0; i < tr.length; i++) {
                           var td = tr[i].querySelectorAll("td");
                           var items=[]; // 初始化，items为该函数域变量
                           var obj11;

                           if(i==0){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>3){
                                       items = ['1'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else if(i==1){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>6){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','1'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                                  else if(i==2){
                                   obj11=randint(1, 20);
                                   if(obj11>6){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                                         else if(i==3){
                                   obj11=randint(1, 20);
                                   if(obj11>4){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

					else if(i==4){
                                             items = ['3','4'];
                                             td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                         }

					else if(i==5){
                                   obj11=randint(1, 20);
                                   if(obj11>4){
                                       items = ['3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }
else if(i==6){
                                   obj11=randint(1, 20);
                                   if(obj11>4){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else{
                                       items = ['0','1','2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }


                                                else if(i==7){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>4){
                                       items = ['1','2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['1','0','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else if(i==8){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>2){
                                       items = ['1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==9){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>2){
                                       items = ['0','1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==10){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2','0'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>2){
                                       items = ['3','1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['2','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==11){
                                   obj11=randint(1, 20);
                                   if(obj11>8){
                                       items = ['1','2','0','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj11>4){
                                       items = ['3','1','0'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else{
                               td[randint(0, td.length - 1)].click(); // 默认随机选择
                           }
                       }
                   }
                   martixSingle_11(); // 注意编号

//div12->与实际题号对应
                   function martixSingle_12() { // 注意编号
                       var q = document.getElementById("div12"); // 注意编号
                       var tr = q.querySelectorAll("tbody > tr");
                       for (var i = 0; i < tr.length; i++) {
                           var td = tr[i].querySelectorAll("td");
                           var items=[]; // 初始化，items为该函数域变量
                           var obj12;

                           if(i==0){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['4','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>2){
                                       items = ['1','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else if(i==1){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>2){
                                       items = ['2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                                  else if(i==2){
                                   obj12=randint(1, 20);
                                   if(obj12>6){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['4','3','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                                         else if(i==3){
                                   obj12=randint(1, 20);
                                   if(obj12>4){
                                       items = ['4','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

					else if(i==4){
                                   obj12=randint(1, 20);
                                   if(obj12>6){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

					else if(i==5){
                                   obj12=randint(1, 20);
                                   if(obj12>4){
                                       items = ['2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }
else if(i==6){
                                   obj12=randint(1, 20);
                                   if(obj12>6){
                                       items = ['4','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>2){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
					items = ['0'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
				}
                           }


                                                else if(i==7){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['2','3','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>4){
                                       items = ['2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['1','3','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else if(i==9){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>2){
                                       items = ['1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==10){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>2){
                                       items = ['0','1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==11){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['1','2','0'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>3){
                                       items = ['3','1','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','1','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==12){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['1','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>4){
                                       items = ['3','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['0','4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

else if(i==13){
                                   obj12=randint(1, 20);
                                   if(obj12>8){
                                       items = ['4','2','3'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                                   else if(obj12>3){
                                       items = ['3','2'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
				else{
                                       items = ['4'];
                                       td[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                   }
                           }

                           else{
                               td[randint(0, td.length - 1)].click(); // 默认随机选择
                           }
                       }
                   }
                   martixSingle_12(); // 注意编号



    /*
     * 普通单选题
     */

    //div1->与实际题号对应
    function singleChoose_1(){ // 注意编号
        var q = document.getElementById("div1"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj1=randint(1, 20);
         if(obj1>8){
             items = ['1','2','3'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         else{
             items = ['0','4'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_1(); // 注意编号

                                                       //div4->与实际题号对应
                                                       function singleChoose_4(){ // 注意编号
                                                           var q = document.getElementById("div4"); // 注意编号
                                                           var list = q.querySelectorAll("li");

                                                           //默认为固定域中随机，可修改为根据需求选择答案
                                                           //list[0].click();
                                                           var items=[];

                                                            var obj4=randint(1, 20);
                                                            if(obj4>10){
                                                                items = ['1'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else{
                                                                items = ['0'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }

                                                       }
                                                    singleChoose_4(); // 注意编号

                                                       //div5->与实际题号对应
                                                       function singleChoose_5(){ // 注意编号
                                                           var q = document.getElementById("div5"); // 注意编号
                                                           var list = q.querySelectorAll("li");

                                                           //默认为固定域中随机，可修改为根据需求选择答案
                                                           //list[0].click();
                                                           var items=[];

                                                            var obj5=randint(1, 20);
                                                            if(obj5>10){
                                                                items = ['1'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else{
                                                                items = ['0'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }

                                                       }
                                                    singleChoose_5(); // 注意编号

                                                       //div6->与实际题号对应
                                                       function singleChoose_6(){ // 注意编号
                                                           var q = document.getElementById("div6"); // 注意编号
                                                           var list = q.querySelectorAll("li");

                                                           //默认为固定域中随机，可修改为根据需求选择答案
                                                           //list[0].click();
                                                           var items=[];

                                                            var obj6=randint(1, 20);
                                                            if(obj6>8){
                                                                items = ['0','1','2'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else if(obj6>3){
                                                                items = ['3'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else{
                                                                items = ['4'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }

                                                       }
                                                    singleChoose_6(); // 注意编号

                                                       //div7->与实际题号对应
                                                       function singleChoose_7(){ // 注意编号
                                                           var q = document.getElementById("div7"); // 注意编号
                                                           var list = q.querySelectorAll("li");

                                                           //默认为固定域中随机，可修改为根据需求选择答案
                                                           //list[0].click();
                                                           var items=[];

                                                            var obj7=randint(1, 20);
                                                            if(obj7>6){
                                                                items = ['1','2','3'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else if(obj7>3){
                                                                items = ['4'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }
                                                            else{
                                                                items = ['0'];
                                                                list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
                                                            }

                                                       }
                                                    singleChoose_7(); // 注意编号

//div13->与实际题号对应
    function singleChoose_13(){ // 注意编号
        var q = document.getElementById("div13"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj13=randint(1, 20);
         if(obj13>10){
             items = ['1'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         else{
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_13(); // 注意编号

//div14->与实际题号对应
    function singleChoose_14(){ // 注意编号
        var q = document.getElementById("div14"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj14=randint(1, 20);
         if(obj14>16){
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         else if(obj14>3){
             items = ['1'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['2'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_14(); // 注意编号

//div15->与实际题号对应
    function singleChoose_15(){ // 注意编号
        var q = document.getElementById("div15"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj15=randint(1, 20);
         if(obj15>16){
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
         else if(obj15>5){
             items = ['1'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['2'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_15(); // 注意编号

//div16->与实际题号对应
    function singleChoose_16(){ // 注意编号
        var q = document.getElementById("div16"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj16=randint(1, 20);
         if(obj16>1){
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['0','1','2'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_16(); // 注意编号

//div17->与实际题号对应
    function singleChoose_17(){ // 注意编号
        var q = document.getElementById("div17"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj=randint(1, 20);
         if(obj>10){
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['1'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_17(); // 注意编号

//div18->与实际题号对应
    function singleChoose_18(){ // 注意编号
        var q = document.getElementById("div18"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj=randint(1, 20);
         if(obj>1){
             items = ['0'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['0','2'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_18(); // 注意编号

//div19->与实际题号对应
    function singleChoose_19(){ // 注意编号
        var q = document.getElementById("div19"); // 注意编号
        var list = q.querySelectorAll("li");

        //默认为固定域中随机，可修改为根据需求选择答案
        //list[0].click();
        var items=[];

         var obj=randint(1, 20);
         if(obj>6){
             items = ['1','2','3'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else if(obj>3){
             items = ['1','2'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else if(obj>1){
             items = ['0','1','3','4'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }
	else{
             items = ['1','5'];
             list[ items[Math.round(Math.random()*(items.length-1)) ]].click();
         }

    }
 singleChoose_19(); // 注意编号




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
