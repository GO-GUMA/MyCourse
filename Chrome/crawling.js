// Init
const activeUrl = window.location.href; // Get Current URL
const prograssURL = "https://smartlead.hallym.ac.kr/report/ubcompletion/user_progress.php?id=" + getClassID(activeUrl); // function getClassID() return classID
var prograssArr = [], missdVideo = []; // prograssArr = ['DONE','LATE','NONE']
var isHidePast = false; // boolean => is user check hide past
var sectionCnt = 0; // int => section title count

var languageJSON; // JSON Object => language sets for current LMS language

fetch(chrome.runtime.getURL('language.json')).then(response => { // Get language json data from 'language.json'
    return response.json();
}).then(jsondata => {
    // console.log('JSON LOADED ' + document.documentElement.lang); // JSON LOADED 'ko' or 'en' or 'ja' or 'zh-cn'
    languageJSON = jsondata[document.documentElement.lang]; // Set languageJSON Object to current LMS json 
});

chrome.storage.sync.get('hidePastCheck', function (result) {
    // console.log('Value currently is ' + result.hidePastCheck);
    isHidePast = result.hidePastCheck;
});

// var wholeVideoCnt = 0; // All Missed video cnt

httpRequest = new XMLHttpRequest(); // HTTPRequest
httpRequest.onreadystatechange = getContents; // HTTPRequest - function getContents()
httpRequest.open('GET', prograssURL);  // open Request session
httpRequest.send(); // Request Data

chrome.storage.sync.get('baseUrl', function (result) {
    if(typeof result.baseUrl === "undefined") {
        const url = location.href.split("/course/")[0];
        chrome.storage.sync.set({ baseUrl: url }, function () {
            console.log('[Init setting] LMS base url is set to ' + url);
        });
    }
});

function getClassID(url) { // return classID
    var id = url.split('?id='); // Split URL by '?id='
    return id[1]
}

function getElement(html) { // Html text to 'html document'
    var div = document.createElement('div');
    div.innerHTML = html;
    return div;
}

function parseHtml(html) { // function parseHtml(html text) => check video status
    var cr = getElement(html) // function getElement('html text') return 'html document'

    if (cr.getElementsByClassName('text-center hidden-xs hidden-sm').length != 0) { // Video Exist Check
        // Search to tbody (tbody has videos tr) 
        var cr_page = cr.querySelector("#page");
        var cr_pageContainer = cr_page.querySelector("#page-mask").querySelector("#page-container");
        var cr_pageContainerWrap = cr_pageContainer.querySelector("#page-content").querySelector("#page-content-wrap");
        var cr_regionMain = cr_pageContainerWrap.querySelector("#region-main");
        var cr_progressreport = cr_regionMain.querySelector('[role="main"]').querySelector('[class="report_ubcompletion progressreport"]');
        var cr_finalTable = cr_progressreport.querySelector("#ubcompletion-progress-wrapper").querySelector('[class="table table-bordered user_progress"]');
        var cr_tBody = cr_finalTable.querySelector('tbody');

        var cr_tr = cr_tBody.querySelectorAll('tr'); // Find all tr tag to cr_tr[]

        for (var i = 0; i < cr_tr.length; i++) {
            var videoCheck = !!cr_tr[i].querySelector('[class="text-center hidden-xs hidden-sm"]'); // if [class="text-center hidden-xs hidden-sm"] exist return true else false
            if (videoCheck) {
                var videoTtile = (cr_tr[i].querySelector('td[class="text-left"]').innerHTML).split('alt=""> ')[1];
                var videoTime = cr_tr[i].querySelector('[class="text-center hidden-xs hidden-sm"]').innerHTML; // Video running time(String)
                var prograssTimeInner = cr_tr[i].querySelector('[class="text-center"]').innerHTML; // User run time(String)
                var prograssTime = prograssTimeInner.split('<br>')[0]; // Seperate time and button

                prograssArr.push([videoTtile, checkPrograss(videoTime, prograssTime)]); // function checkPrograss(VideoRunningTime, UserRunTime) return ['DONE' or 'LATE' or 'NONE'] and push to prograssArr
            }
        }
    }

    showOnPage(prograssArr);
}

function showOnPage(progArr) { // function showOnPage(User video status) => Show data on view.php 
    // Search every videos
    var cr_li = document.querySelectorAll('li[class="activity vod modtype_vod "]'); // Find all li tag that has class="activity vod modtype_vod" to cr_li[]

    if (cr_li.length != 0 && progArr.length == 0) {
        displayBoard([],true)
    } else {
        for (var i = 0; i < cr_li.length; i++) {
            var cr_span_InnerHtml = cr_li[i].querySelector('span[class="instancename"]').innerHTML; // Base html at view.php 'Course name, Due, ETC..'
            var appendColor; // (String) => Color of status circle

            // console.log(cr_li[i].querySelector('span[class="text-ubstrap"]').innerHTML); // Working
            var videoTtile = cr_span_InnerHtml.split('<span')[0];
            var sectionID = cr_li[i].parentNode.parentNode.parentNode.id; // Week ID
            var dueDate = cr_li[i].querySelector('span[class="text-ubstrap"]').innerHTML; // Due date String
            var playTime = cr_li[i].querySelector('span[class="text-info"]').innerHTML.split(' ')[1];

            const status = progArr[findIndex(progArr, videoTtile)][1];
            // console.log(status);

            if (status == 'DONE') {
                appendColor = '#2a7bcd'; // Set color to blue
            } else if (status == 'NONE') {
                appendColor = '#dc5648'; // Set color to Red
                missdVideo.push([videoTtile, 'background-color:#dc5648;', sectionID, dueDate, playTime]);
            } else {
                appendColor = '#949997'; // Set color to Gray 
                missdVideo.push([videoTtile, 'background-color:#949997;', sectionID, dueDate, playTime]);
            }

            var appendStr = '<div style="width:13px; height:13px; background-color:' + appendColor + '; border-radius: 50%;"></div>'; // Set Color
            cr_li[i].querySelector('span[class="instancename"]').innerHTML = appendStr + ' ' + cr_span_InnerHtml; // append to base Html at view.php

            // cr_li[i].querySelector('img[class="activityicon"]').src = chrome.runtime.getURL('images/done.png'); // Test Change Image
        }
        displayBoard(delMulti2D(missdVideo));
    }
}

function displayBoard(mVideo, errorStat = false) { // function displayBoard(array missdVideo[][]) => show missedVideo board
    var parentNode = document.querySelector('div[class="course-content"]');
    var pushNode = parentNode.querySelector('div[class="total_sections"]');

    var outerDiv = document.createElement('div');
    outerDiv.setAttribute('class', 'user_attendance course_box');
    outerDiv.setAttribute('style', 'margin-bottom: 20px');

    var h2_main = document.createElement('h2');
    h2_main.setAttribute('class', 'main');
    h2_main.innerHTML = languageJSON['title']; // '미수강 강좌';

    // CheckBox
    var cb_div = document.createElement('div');
    cb_div.setAttribute('style', 'float: right;');
    // cb_div.setAttribute('id','cb_div');

    var cb_label = document.createElement('label');
    cb_label.setAttribute('style', 'margin-right: 20px; margin-top: 17px;')

    var cb_input;

    if (isHidePast) {
        cb_input = '<input type="checkbox" name="hidePast" value="hidePast" id="hidePost" checked>' + languageJSON['cb_text']; // 지난 강좌 숨기기';
    } else {
        cb_input = '<input type="checkbox" name="hidePast" value="hidePast" id="hidePost">' + languageJSON['cb_text']; // 지난 강좌 숨기기';
    }


    cb_label.innerHTML = cb_input;
    cb_div.appendChild(cb_label);
    outerDiv.appendChild(cb_div);

    cb_label.addEventListener("click", function () {
        var cb_query = cb_label.querySelector('input');
        var noVideoAlertDOM = document.getElementById('noVideoAlert');
        var PlacerOne = document.getElementById('placerOne');

        if (cb_query.checked && !isHidePast) {
            isHidePast = true;

            var passed = document.querySelectorAll('#duePassed');
            for (i = 0; i < passed.length; i++) {
                passed[i].hidden = true;
            }

            if ((missdVideo.length + sectionCnt) == passed.length) {
                noVideoAlertDOM.hidden = false;
                PlacerOne.hidden = true;
            }

        } else if (!cb_query.checked && isHidePast) {
            isHidePast = false;

            var passed = document.querySelectorAll('#duePassed');

            for (i = 0; i < passed.length; i++) {
                passed[i].hidden = false;
            }

            if ((missdVideo.length + sectionCnt) == passed.length) {
                noVideoAlertDOM.hidden = true;
                PlacerOne.hidden = false;
            }
        }
    }, false);
    // CheckBox End

    var boardDiv = document.createElement('div');
    var noVideoAlert = document.createElement('p');
    noVideoAlert.setAttribute('style', 'color:#666; text-align: center; margin-top: 10px; font-size: 14px;');
    noVideoAlert.setAttribute('id', 'noVideoAlert');
    noVideoAlert.setAttribute('hidden', true);
    noVideoAlert.innerHTML = languageJSON['noMissedVideo']; // '미수강 영상이 없습니다';


    if (prograssArr.length == 0) {
        noVideoAlert.innerHTML = languageJSON['noVideo']; // '동영상이 없는 강의 입니다';
        cb_div.hidden = true;
    }

    if (errorStat) {
        noVideoAlert.innerHTML = languageJSON['noVideoCheck']; // '학습 진도가 집계되는 동영상이 없는 강의 입니다.';
    }

    boardDiv.appendChild(noVideoAlert);

    var currneTime = new Date();
    var pastCnt = 0 // for counting missedVideo and it is past

    var missedCnt = mVideo.length; // Whole video missed Video Count

    console.log(prograssArr.length)

    if (missedCnt == 0 && prograssArr.length != 0) {
        noVideoAlert.innerHTML = languageJSON['noMissedAndPast']; //'지난 영상 & 미수강 영상이 없습니다';
        noVideoAlert.hidden = false;
        cb_div.hidden = true;
    } else {
        var sectionStatus = null; // Current section status
        sectionCnt = 0 // Init section count
        for (i = 0; i < missedCnt; i++) {
            var videoDiv = document.createElement('Div');
            videoDiv.setAttribute('style', 'height: auto; padding-left: 10px; padding-top: 5px; margin-top: 5px;')
            videoDiv.innerHTML = '<div style="width:16px; height:16px; ' + mVideo[i][1] + ' border-radius: 50%; float:left; margin-top: 2px; margin-left: 20px"></div>'; // Set color to Gray
            videoDiv.innerHTML += '<a style="color:#000; font-size: 14px;" href="#' + mVideo[i][2] + '">&nbsp' + mVideo[i][0] + '</a>'; // Set color to Gray

            // Calculat Date distance
            var dueDateStr = (mVideo[i][3].split('~ ')[1]).replace(/[^0-9]/g, ""); // Date String 'YYYYMMDDHHMMSS'
            var dueYear = dueDateStr.substr(0, 4);
            var dueMonth = dueDateStr.substr(4, 2);
            var dueDate = dueDateStr.substr(6, 2);
            var dueHour = dueDateStr.substr(8, 2);
            var dueMin = dueDateStr.substr(10, 2);
            var dueSec = dueDateStr.substr(12, 2);

            var dueCheck = new Date(dueYear, dueMonth - 1, dueDate, dueHour, dueMin, dueSec);
            var dueLeft = dueCheck - currneTime; // Milliseconds

            if (dueLeft < 0) {
                videoDiv.setAttribute('id', 'duePassed');
            }

            if (isHidePast && dueLeft < 0) { // Storage 'Hide past videos' is true AND due passed
                videoDiv.setAttribute('hidden', 'true');
                pastCnt += 1
            }

            videoDiv.innerHTML += '<span style="color:#f3773a; font-size: 12px;" class="time-left" data-time="' + dueCheck + '"> ' + millToTime(dueLeft) + ' </span>' // Due date
            // videoDiv.innerHTML += '<span style="color:#f3773a; font-size: 12px;" class="time-left"> ' + millToTime(dueLeft) + ' (' + mVideo[i][3].substr(6) + ')</span>' // Due date
            videoDiv.innerHTML += '<span style="color:#31708f; font-size: 12px;">&nbsp;' + mVideo[i][4] + '</span>' // Video running time

            // Working 2022Feb26
            var sectionDiv = document.createElement('Div');
            sectionDiv.style = 'margin-left: 50px; margin-top: 20px;'
            sectionDiv.innerHTML = '<a style="cursor: pointer; font-size: 16px;" href="#' + mVideo[i][2] + '">' + mVideo[i][2].split('-')[1] + '주차<a>';

            if (dueLeft < 0) {
                sectionDiv.setAttribute('id', 'duePassed');
                if (isHidePast) {
                    sectionDiv.setAttribute('hidden', 'true');
                }
            }

            if (sectionStatus == null) {
                boardDiv.appendChild(sectionDiv)
                sectionStatus = mVideo[i][2];
                sectionCnt += 1
            } else {
                if (sectionStatus != mVideo[i][2]) {
                    boardDiv.appendChild(sectionDiv)
                    sectionCnt += 1
                    // console.log(mVideo[i][2]);
                }
            }

            boardDiv.appendChild(videoDiv); // append on parent DIV
        }

        if (isHidePast && pastCnt == missdVideo.length) {
            noVideoAlert.hidden = false; // Show noVideoAlert DIV
            boardDiv.innerHTML += '<div style="height: 20px;" id="placerOne" hidden></div>';
        } else {
            boardDiv.innerHTML += '<div style="height: 20px;" id="placerOne"></div>';
        }
    }

    outerDiv.appendChild(h2_main);
    outerDiv.appendChild(boardDiv);


    parentNode.insertBefore(outerDiv, pushNode);
}


function checkPrograss(vTime, pTime) { // function checkPrograss(VideoRunningTime, UserRunTime) return ['DONE' or 'LATE' or 'NONE']
    var vTimeSplit = vTime.split(':'); // Split string time by :
    var pTimeSplit = pTime.split(':');
    var vTimeSec, pTimeSec, status; // vTimeSec, pTimeSec convert to Seconds status = ['DONE' or 'LATE' or 'NONE']

    if (vTimeSplit.length == 3) { // HOUR [HOUR:MIN:SEC]
        vTimeSec = (parseInt(vTimeSplit[0]) * 3660) + (parseInt(vTimeSplit[1]) * 60) + parseInt(vTimeSplit[2]);
    } else if (vTimeSplit.length == 2) {
        vTimeSec = (parseInt(vTimeSplit[0]) * 60) + parseInt(vTimeSplit[1]);
    } else {
        vTimeSec = parseInt(vTimeSplit[0]);
    }

    if (pTimeSplit.length == 3) { // MIN [MIN:SEC]
        pTimeSec = (parseInt(pTimeSplit[0]) * 3660) + (parseInt(pTimeSplit[1]) * 60) + parseInt(pTimeSplit[2]);
    } else if (pTimeSplit.length == 2) {
        pTimeSec = (parseInt(pTimeSplit[0]) * 60) + parseInt(pTimeSplit[1]);
    } else {
        pTimeSec = parseInt(pTimeSplit[0]);
    }

    if (vTimeSec <= pTimeSec) { // User done
        status = 'DONE'
    } else if (pTimeSec == 0 || !pTimeSec) { // User running time is 0 OR running time is NaN
        status = 'NONE'
    } else { // User running time is larger than 0 but less that Video Running Time 
        status = 'LATE'
    }

    return status;
}

function getContents() { // function getContents() => check readyStatus and run parseHtml()
    // console.log('readyState : ' + httpRequest.readyState);
    // console.log('status : ' + httpRequest.status);

    if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
            // console.log('SUCCESS');
            parseHtml(httpRequest.responseText);
        } else {
            // console.log('FAIL');
        }
    }
}

function millToTime(clacTime) { // function millToTime(int milliseconds) return 'DD일 HH시 MM분 SS초 남음 or 지남'
    // console.log(clacTime)
    var leftOrPast = languageJSON['timeLeft']; // '남음'; // leftOrPast for result String

    if (clacTime < 0) { // if clacTime is lower that o = Video Expired
        leftOrPast = languageJSON['timePassed']; // '지남'; // Change navigator
    }

    var clacTime = (clacTime < 0) ? (clacTime * -1) / 1000 : clacTime / 1000; // Conver Negative to Positive and change to Seconds
    clacTime = parseInt(clacTime); // Drop points
    var dueDateLeft = clacTime / 86400; // Get Date
    clacTime -= parseInt(dueDateLeft) * 86400;
    var dueHourLeft = clacTime / 3600; // Get Hour
    clacTime -= parseInt(dueHourLeft) * 3600;
    var dueMinLeft = clacTime / 60; // Get Minute
    clacTime -= parseInt(dueMinLeft) * 60;
    var dueSecLeft = clacTime; // Get Seconds

    // Switch to Int
    var date = ('00' + parseInt(dueDateLeft)).slice(-2);
    var hour = ('00' + parseInt(dueHourLeft)).slice(-2);
    var min = ('00' + parseInt(dueMinLeft)).slice(-2);
    var sec = ('00' + parseInt(dueSecLeft)).slice(-2);

    var result = date + languageJSON['days'] + ' ' + hour + languageJSON['hours'] + ' ' + min + languageJSON['minutes'] + ' ' + sec + languageJSON['seconds'] + ' ' + leftOrPast; // final result string = 'DD일 HH시 MM분 SS초 남음 or 지남'
    // var result = date + '일 ' + hour + '시간 ' + min + '분 ' + sec + '초 ' + leftOrPast; // final result string = 'DD일 HH시 MM분 SS초 남음 or 지남'
    return result; // End
}

function findIndex(array, searchTitle) { // function findIndex(Array array, String searchTitle)
    for (i = 0; i < array.length; i++) {
        if (String(array[i][0]) === String(searchTitle)) {
            return i;
        }
    }
    return -1;
}

function delMulti2D(array) {
    var tempArr = [];
    for (i = 0; i < array.length; i++) {
        var joined = array[i].join('%*%');
        if (tempArr.indexOf(joined) == -1) {
            tempArr.push(joined);
        }
    }

    var lastArr = [];
    for (i = 0; i < tempArr.length; i++) {
        lastArr.push(tempArr[i].split('%*%'));
    }

    return lastArr;
}