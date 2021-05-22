# 问卷星自动答题Pro（可设置偏好选项概率作答）
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
// @author_update      Github_0hhhhhhhhh...
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
