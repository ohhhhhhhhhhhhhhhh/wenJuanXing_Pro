// ==UserScript==
// @name         问卷星自动答题Pro（可设置偏好选项概率作答）
// @version      0.4.1
// @description version 0.4->原作者为@Github_ZainCheung: 全自动填写问卷星问卷，支持自定义填空答案，最快可平均两三秒填写一份问卷，可多开几个标签同时填写，智能验证功能未实现，可能需要手动验证
// 2021.05.22 更新日志：可以设定普通单选题答案，提供随机选择和设定概率作答的方式；填空题可根据设定自动填写；支持自定义选择矩阵单选题
// 已适配题型（源码参看/wenjuanxin.user.js，本脚本为修订版）
// 表格/矩阵选择题 - 单选
// 单选
// 填空 默认为空（需要设置）
// @author       Github_ZainCheung
// @author_update      Github_ohhhhhhhhh...
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
            answer: ["父母给","自己兼职","傍富婆"]
        },
        {
            id: 6,//第六题:你曾经或现在的恋爱时长是多长时间？（X日/X个月/X年）
            answer: ["三天","一个月","两个月","五个月","十个月","一年","两年","三年","五年","十年"]
        },
        {
            id: 7,//第七题:恋爱时的每月花费是多少元？
            answer: [100,200,300,400,500,600,700,800,900,1000,1500,2000]
        },
        {
            id: 16,//第七题:根据第15题，选择该地区的原因是？
            answer: ["个人喜好","没有原因"]
        },
        {
            id: 17,//第七题:你对另一半的身高要求具体是多少m？（数值）
            answer: [1.6,1.65,1.7,1.75,1.8,1.85,1.9]
        },
        {
            id: 18,//第七题:你能接受另一半的恋爱次数最多是多少次？（数值）
            answer: [0,1,2,3,4,5,6,7,8,9,10]
        },
        {
            id: 19,//第七题:你认为大学期间情侣每天在一起多长时间合适？（X个小时）
            answer: [0.5,1,1.5,2,2.5,3,3.5,4]
        }
    ];
     */



    //答题结束，则打开新的问卷
    //https://www.wjx.cn/jq/111241047.aspx
    /*
     ⚠️
     ⚠️
     ⚠️
     ⚠️ 注意：问卷链接需要转换为以上*jq/yourId.aspx的形式，Id可在网页源码中查看到 ⚠️
     ⚠️
     ⚠️
     ⚠️
     */
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
        /**
         * @name 普通单选题随机选择
         * @param {object}  subject single subject
         */
        this.singleChoose = function(subject) {
            if (subject.querySelectorAll("img")[0]) { //带有图片的，无法直接click 标签<li>
                var img = subject.querySelectorAll("img");
                img[randint(0, img.length - 1)].click();
            } else {
                var list = subject.querySelectorAll("li");
                var no;
                for(var i = 0; i < list.length; i++){
                    if(list[i].querySelector(".underline") != null){
                        no = i;
                    }
                }
                var index = randint(0, list.length - 1);
                while(index == no){index = randint(0, list.length - 1);}
                list[index].click();

            }
        }

/*
        //表格单选
        this.martixSingleChoose = function(subject) {
                var tr = subject.querySelectorAll("tbody > tr");
                for (var i = 0; i < tr.length; i++) {
                    var td = tr[i].querySelectorAll("td");
                    td[randint(0, td.length - 1)].click();
                }
            }
*/
        
        this.dropdownSelect = function(subject) {
            var select = subject.querySelectorAll("select")[0];
            var rnnum = randint(1, select.length - 1);
            select.selectedIndex = rnnum;
        }

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
     * @name 智慧树题目类型判断，并随机选择
     * 修改后，为矩阵/表格单选题
     */
    
    //div2
    function martixSingle_2() {
        //q = $$(".div_question");
        var q = document.getElementById("div2");
        //var rc = new RandomChoose();
        //rc.martixSingleChoose(q);
        var tr = q.querySelectorAll("tbody > tr");
        for (var i = 0; i < tr.length; i++) {
            var td = tr[i].querySelectorAll("td");
            var items_0=[];
            
            if(i==0){
                items_0 = ['0','1'];
                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
            }
            
            if(i==1){
                items_0 = ['0','1','2'];
                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
            }
            
            else{
                td[randint(0, td.length - 1)].click();
            }
        }
    }
    martixSingle_2();
    
        //div3
        function martixSingle_3() {
            //q = $$(".div_question");
            var q = document.getElementById("div3");
            //var rc = new RandomChoose();
            //rc.martixSingleChoose(q);
            var tr = q.querySelectorAll("tbody > tr");
            for (var i = 0; i < tr.length; i++) {
                var td = tr[i].querySelectorAll("td");
                var items_0=[];
                
                if(i==0){
                    items_0 = ['0'];
                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                }
                
                if(i==1){
                    items_0 = ['0','1'];
                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                }
                
                if(i==2){
                    items_0 = ['0','1','2'];
                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                }
                
                if(i==3){
                    items_0 = ['3','4'];
                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                }
                
                else{
                    td[randint(0, td.length - 1)].click();
                }
            }}
        martixSingle_3();
            
            //div8
            function martixSingle_8() {
                //q = $$(".div_question");
                var q = document.getElementById("div8");
                //var rc = new RandomChoose();
                //rc.martixSingleChoose(q);
                var tr = q.querySelectorAll("tbody > tr");
                for (var i = 0; i < tr.length; i++) {
                    var td = tr[i].querySelectorAll("td");
                    var items_0=[];
                    
                    if(i==0){
                        items_0 = ['2','3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==1){
                        items_0 = ['3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==2){
                        items_0 = ['2','3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==3){
                        items_0 = ['3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==5){
                        items_0 = ['1','2','3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==6){
                        items_0 = ['3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==7){
                        items_0 = ['0','1','2'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==8){
                        items_0 = ['3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    if(i==9){
                        items_0 = ['2','3','4'];
                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                    }
                    
                    else{
                        td[randint(0, td.length - 1)].click();
                    }
                }}
            martixSingle_8();
                
                //div9
                function martixSingle_9() {
                    //q = $$(".div_question");
                    var q = document.getElementById("div9");
                    //var rc = new RandomChoose();
                    //rc.martixSingleChoose(q);
                    var tr = q.querySelectorAll("tbody > tr");
                    for (var i = 0; i < tr.length; i++) {
                        var td = tr[i].querySelectorAll("td");
                        var items_0=[];
                        
                        if(i==3){
                            items_0 = ['3','4'];
                            td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                        }
                        
                        if(i==4){
                            items_0 = ['2','3','4'];
                            td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                        }
                        
                        if(i==5){
                            items_0 = ['1','2','3','4'];
                            td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                        }
                        
                        else{
                            td[randint(0, td.length - 1)].click();
                        }
                    }}
                martixSingle_9();
                    
                    //div10
                    function martixSingle_10() {
                        //q = $$(".div_question");
                        var q = document.getElementById("div10");
                        //var rc = new RandomChoose();
                        //rc.martixSingleChoose(q);
                        var tr = q.querySelectorAll("tbody > tr");
                        for (var i = 0; i < tr.length; i++) {
                            var td = tr[i].querySelectorAll("td");
                            var items_0=[];
                            
                            if(i==1){
                                items_0 = ['1','2','3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==2){
                                items_0 = ['2','3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==3){
                                items_0 = ['3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==4){
                                items_0 = ['2','3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==5){
                                items_0 = ['3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==7){
                                items_0 = ['1','2','3'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            if(i==8){
                                items_0 = ['1','2','3','4'];
                                td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                            }
                            
                            else{
                                td[randint(0, td.length - 1)].click();
                            }
                        }}
                    martixSingle_10();
                        
                        //div11
                        function martixSingle_11() {
                            //q = $$(".div_question");
                            var q = document.getElementById("div11");
                            //var rc = new RandomChoose();
                            //rc.martixSingleChoose(q);
                            var tr = q.querySelectorAll("tbody > tr");
                            for (var i = 0; i < tr.length; i++) {
                                var td = tr[i].querySelectorAll("td");
                                var items_0=[];
                                
                                if(i==0){
                                    items_0 = ['1','2','3','0'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==1){
                                    items_0 = ['1','2','0'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==2){
                                    items_0 = ['1','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==3){
                                    items_0 = ['1','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==4){
                                    items_0 = ['4','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==5){
                                    items_0 = ['4','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==6){
                                    items_0 = ['1','2','3','4'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==7){
                                    items_0 = ['4','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==8){
                                    items_0 = ['1','2','0'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==9){
                                    items_0 = ['1','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==10){
                                    items_0 = ['0','1','2','3'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                if(i==11){
                                    items_0 = ['1','2','0'];
                                    td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                }
                                
                                else{
                                    td[randint(0, td.length - 1)].click();
                                }
                            }}
                        martixSingle_11();
                            
                            //div12
                            function martixSingle_12() {
                                //q = $$(".div_question");
                                var q = document.getElementById("div12");
                                //var rc = new RandomChoose();
                                //rc.martixSingleChoose(q);
                                var tr = q.querySelectorAll("tbody > tr");
                                for (var i = 0; i < tr.length; i++) {
                                    var td = tr[i].querySelectorAll("td");
                                    var items_0=[];
                                    
                                    if(i==0){
                                        items_0 = ['1','2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==1){
                                        items_0 = ['1','2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==2){
                                        items_0 = ['1','2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==3){
                                        items_0 = ['3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==4){
                                        items_0 = ['1','2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==6){
                                        items_0 = ['1','2','3'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==10){
                                        items_0 = ['1','2','3','0'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==11){
                                        items_0 = ['1','2','3','0'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==12){
                                        items_0 = ['1','2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    if(i==13){
                                        items_0 = ['2','3','4'];
                                        td[ items_0[Math.floor(Math.random()*items_0.length)] ].click();
                                    }
                                    
                                    else{
                                        td[randint(0, td.length - 1)].click();
                                    }
                                }}
                            martixSingle_12();
    
    
    /*
     * 普通单选
     */
    
    //div1
    function SingleChoose_1(){
        var q = document.getElementById("div1");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        var items = ['1','2','3','4'];
        list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_1();
    
    //div4
    function SingleChoose_4(){
        var q = document.getElementById("div4");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        list[0].click();
        //var items = ['1','2','3','4'];
        //list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_4();
    
    //div5
    function SingleChoose_5(){
        var q = document.getElementById("div5");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>3){
            items = ['1','2','3'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['0','4'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_5();
    
    //div6
    function SingleChoose_6(){
        var q = document.getElementById("div6");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>3){
            items = ['1','2','3'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['0','4'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_6();
    
    //div7
    function SingleChoose_7(){
        var q = document.getElementById("div7");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机选取元素
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>2){
            items = ['1','2','3'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['0','4'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_7();
    
    //div13
    function SingleChoose_13(){
        var q = document.getElementById("div13");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        var items = ['1','0'];
        list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_13();
    
    //div14
    function SingleChoose_14(){
        var q = document.getElementById("div14");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>4){
            items = ['1','0'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['2','1'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_14();
    
    //div15
    function SingleChoose_15(){
        var q = document.getElementById("div15");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>4){
            items = ['3'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['2','3','4','5'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_15();
    
    //div16
    function SingleChoose_16(){
        var q = document.getElementById("div16");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        list[0].click();
        //var items = ['1','2','3','4'];
        //list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_16();
    
    //div17
    function SingleChoose_17(){
        var q = document.getElementById("div17");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        var items = ['1','0'];
        list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_17();
    
    //div18
    function SingleChoose_18(){
        var q = document.getElementById("div18");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        list[0].click();
        //var items = ['1','0'];
        //list[ items[Math.floor(Math.random()*items.length)] ].click();
    }
 SingleChoose_18();
    
    //div19
    function SingleChoose_19(){
        var q = document.getElementById("div19");
        //var rc = new RandomChoose();
        //rc.singleChoose(q[i]);
        //普通单选
        var list = q.querySelectorAll("li");
        
        //默认根据需求选择答案，可修改为固定域中随机
        //list[0].click();
        //此题需要设置答题概率
        var num=randint(0, 10);
        var items=[];
        if(num>4){
            items = ['2','3'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else if(num>2){
            items = ['0','1','2','3','4','5'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
        else{
            items = ['2','3','4'];
            list[ items[Math.floor(Math.random()*items.length)] ].click();
        }
    }
 SingleChoose_19();
    
    
  

            
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
    var runTime=myRandint(20, 65); //设置随机作答时间为20-65s
    setTimeout(function(){
        // 延时runTime秒防止验证（事实上还是有智能验证）
        document.getElementById("submit_button").click();
        console.log("答题成功!");
    }, runTime*1000 ); // 样本量较小时，这样设置
    // 即，不要设置为这样：var runTime=myRandint(20000, 65000);
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
