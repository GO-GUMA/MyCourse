var languageJSON; // JSON Object => language sets for current LMS language

// Checking Storage to get check status
chrome.storage.sync.get('hidePastCheck', function (result) {
    if (typeof result.hidePastCheck === "undefined") { // if Extension is running first time
        var cb_pastCheck = document.getElementById('hidePastSetting');
        cb_pastCheck.checked = true;

        chrome.storage.sync.set({ hidePastCheck: true }, function () {
            console.log('[Init setting] Past video check box data update to ' + true);
        });
    }

    if (result.hidePastCheck) {
        var cb_pastCheck = document.getElementById('hidePastSetting');
        cb_pastCheck.checked = true;
    }
});

chrome.storage.sync.get('closeVideoAuto', function (result) {
    if (typeof result.closeVideoAuto === "undefined") { // if Extension is running first time
        var cb_closeVideoAuto = document.getElementById('closeVideoAuto');
        cb_closeVideoAuto.checked = true;

        chrome.storage.sync.set({ closeVideoAuto: true }, function () {
            console.log('[Init setting] Close video auto check box data update to ' + true);
        });
    }

    if (result.closeVideoAuto) {
        var cb_closeVideoAuto = document.getElementById('closeVideoAuto');
        cb_closeVideoAuto.checked = true;
    }
});

// language check status
chrome.storage.sync.get('languageCheck', function (result) {
    if (typeof result.languageCheck === "undefined") { // if Extension is running first time
        chrome.storage.sync.set({ languageCheck: 'ko' }, function () {
            console.log('[Init setting] Language setted ko');
        });
    }

    if (result.languageCheck == 'en') {
        document.documentElement.lang = 'en'
    } else {
        document.documentElement.lang = 'ko'
    }
});

fetch(chrome.runtime.getURL('language.json')).then(response => { // Get language json data from 'language.json'
    return response.json();
}).then(jsondata => {
    console.log('JSON LOADED ' + document.documentElement.lang); // JSON LOADED 'ko' or 'en' or 'ja' or 'zh-cn'
    languageJSON = jsondata[document.documentElement.lang]; // Set languageJSON Object to current LMS json 
    setLanguage(); // Run langauge setter
});


// Update to storage
cb_pastVideo = document.getElementById('hidePastSetting');
cb_pastVideo.addEventListener("click", function () {
    chrome.storage.sync.set({ hidePastCheck: cb_pastVideo.checked }, function () {
        console.log('Past video check box data update to ' + cb_pastVideo.checked)
    });
});


cb_closeVideoAuto = document.getElementById('closeVideoAuto');
cb_closeVideoAuto.addEventListener('click', function () {
    chrome.storage.sync.set({ closeVideoAuto: closeVideoAuto.checked }, function () {
        console.log('close video auto check box data update to ' + closeVideoAuto.checked)
    });
})


// Github icon button
document.getElementById('githubIcon').onclick = function () {
    window.open('https://github.com/GO-GUMA/MyCourse', '_blank');
}

// Main icon button
document.getElementById('mailIcon').onclick = function () {
    alert('메일주소가 클립보드에 복사되었습니다.')
    copyToClipBoard()
}

// Feedback icon
document.getElementById('feedback').onclick = function () {
    window.open('http://go-guma.com/bbs/board.php?bo_table=MyCourse', '_blank');
}

// Clipboard copier
function copyToClipBoard() {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.value = 'gangsu1813@naver.com';
    ta.select();
    document.execCommand('copy')
    document.body.removeChild(ta);
}

// English button
document.getElementById('language').onclick = function () {
    document.documentElement.lang = languageJSON['pu_languageButton']; // Set html[lang=''] as (lang == 'en') -> 'ko' or (lang == 'ko') -> 'en'

    chrome.storage.sync.set({ languageCheck: languageJSON['pu_languageButton'] }, function () {
        console.log('Past video check box data update to ' + languageJSON['pu_languageButton'])
    });

    fetch(chrome.runtime.getURL('language.json')).then(response => { // Get language json data from 'language.json'
        return response.json();
    }).then(jsondata => {
        console.log('JSON LOADED ' + document.documentElement.lang); // JSON LOADED 'ko' or 'en' or 'ja' or 'zh-cn'
        languageJSON = jsondata[document.documentElement.lang]; // Set languageJSON Object to current LMS json 
        setLanguage(); // Run langauge setter
    });
}

function setLanguage() { //language
    document.getElementById('indicateSetting').innerHTML = languageJSON['pu_setting']; // Settings
    document.getElementById('hidePast_info').innerHTML = languageJSON['pu_hidePast_info']; // Hide expired videos automatically
    document.getElementById('hidePast_text').innerHTML = languageJSON['pu_hidePast']; // Hide expired videos
    document.getElementById('closeVideoAuto_info').innerHTML = languageJSON['pu_closeVideoAuto_info']; // Close video window after finish
    document.getElementById('closeVideoAuto_text').innerHTML = languageJSON['pu_closeVideoAuto']; // Close video auto
    document.getElementById('leaveFeedback').innerHTML = languageJSON['pu_feedback']; // Leave feedback
    document.getElementById('copyEmail').innerHTML = languageJSON['pu_copyMail']; // copy e-mail
    document.getElementById('language').innerHTML = languageJSON['pu_languageButton']; // ko
}

async function checkCourseList() {
    const courseListUrl = "https://smartlead.hallym.ac.kr/local/ubion/user";
    let courseIdList;

    await fetch(courseListUrl)
    .then((response) => {return response.text()})
    .then((html) => {
        courseIdList = parseHtml_pu(html);
    })

    return courseIdList
}

function parseHtml_pu(html) { // function parseHtml(html text) => check video status
    var cr = getElement(html) // function getElement('html text') return 'html document'
    let courseIdList = [];

    const my_course_lists = cr.querySelector('tbody.my-course-lists');
    const courseList = my_course_lists.querySelectorAll('a.coursefullname');
    courseList.forEach((course) => {
        courseIdList.push((course.href).split('?id=')[1]);
    })

    return courseIdList
}

function getElement(html) { // Html text to 'html document'
    var div = document.createElement('div');
    div.innerHTML = html;
    return div;
}

async function fetchParser(url) {
    await fetch(url)
    .then((response) => {return response.text()})
    .then((html) => {
        return getElement(html);
    })
}

async function crawlInit() {
    const courseIdList = await checkCourseList(); // get course id's
    const tasks = await getTaskList(courseIdList);

    // const unSubmitted = tasks.filter((task) => (task.status == false && task.missed == false));
    console.log(tasks);
}

async function getTaskList(courseIdList) {
    const taskUrlFormer = "https://smartlead.hallym.ac.kr/mod/assign/index.php?id=";
    let tasks = [];

    for await (const course_id of courseIdList) {
        let courseTaskUrl = taskUrlFormer + course_id;
        let document_res;

        await fetch(courseTaskUrl)
        .then((response) => {return response.text()})
        .then((html) => {
            document_res = getElement(html);
        })
        
        const course_name = (document_res.querySelector('div.coursename > h1 > a').innerHTML).split("[")[0];
        const tbody_list = document_res.querySelector('table.generaltable > tbody');
        if(tbody_list ?? false) {
            course_list = tbody_list.querySelectorAll('tr:nth-child(odd)');

            course_list.forEach((course) => {
                const task_name = course.querySelector('a').innerHTML; // String - Task name
                const task_id = (course.querySelector('a').href).split('?id=')[1];
                const task_status = (course.querySelector('td.cell.c3').innerHTML == "미제출") ? false : true; // Boolean - Task status
                const task_due = course.querySelector('td.cell.c2').innerHTML; // Boolean - Task status
                let task = new Object();

                task.course = course_name;
                task.name = task_name;
                task.status = task_status;
                task.due = task_due; 
                task.id = task_id; 
                task.course_id = course_id;
                task.missed = ((new Date(task_due) - new Date()) < 0) ? true : false;

                tasks.push(task);
            })
        }
    }

    return tasks
}

crawlInit();