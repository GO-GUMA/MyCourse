var languageJSON; // JSON Object => language sets for current LMS language
let LMSBaseUrl;
const tasks_skeleton = document.querySelectorAll('.skeleton-div');

// Checking Storage to get check status
chrome.storage.sync.get('hidePastCheck', function (result) {
    const cb_pastCheck = document.getElementById('hidePastSetting');
    if (typeof result.hidePastCheck === "undefined") { // if Extension is running first time
        cb_pastCheck.checked = true;

        chrome.storage.sync.set({ hidePastCheck: true }, function () {
            console.log('[Init setting] Past video check box data update to ' + true);
        });
    }

    if (result.hidePastCheck) {
        cb_pastCheck.checked = true;
    }
});

chrome.storage.sync.get('closeVideoAuto', function (result) {
    const cb_closeVideoAuto = document.getElementById('closeVideoAuto');
    if (typeof result.closeVideoAuto === "undefined") { // if Extension is running first time
        cb_closeVideoAuto.checked = true;
        chrome.storage.sync.set({ closeVideoAuto: true }, function () {
            console.log('[Init setting] Close video auto check box data update to ' + true);
        });
    }

    if (result.closeVideoAuto) {
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

// Get LMS Base URL
chrome.storage.sync.get('baseUrl', function (result) {
    const url_alert = document.querySelector('#url-alert'); // 강의 최초 접속 안내
    if(result.baseUrl) {
        LMSBaseUrl = result.baseUrl;
        url_alert.hidden = true;
        crawlInit(); // 과제 불러오기 시작
    } else {
        hideSkeleton();
        url_alert.hidden = false;
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

// Clipboard copier
function copyToClipBoard() {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.value = 'gangsu1813@naver.com';
    ta.select();
    document.execCommand('copy')
    document.body.removeChild(ta);
}


function setLanguage() { //language
    document.getElementById('setting-title').innerHTML = languageJSON['pu_setting']; // Settings
    document.getElementById('hidePast_info').innerHTML = languageJSON['pu_hidePast_info']; // Hide expired videos automatically
    document.getElementById('hidePast_text').innerHTML = languageJSON['pu_hidePast']; // Hide expired videos
    document.getElementById('closeVideoAuto_info').innerHTML = languageJSON['pu_closeVideoAuto_info']; // Close video window after finish
    document.getElementById('closeVideoAuto_text').innerHTML = languageJSON['pu_closeVideoAuto']; // Close video auto
    document.getElementById('leaveFeedback').innerHTML = languageJSON['pu_feedback']; // Leave feedback
    document.getElementById('copyEmail').innerHTML = languageJSON['pu_copyMail']; // copy e-mail
    document.getElementById('language').innerHTML = languageJSON['pu_languageButton']; // ko
    document.getElementById('myTask').innerHTML = languageJSON['pu_myTask']; // My tasks
    document.getElementById('course-settings-title').innerHTML = languageJSON['pu_courseSettings']; // Course settings
}

async function checkCourseList() {
    const courseListUrl = LMSBaseUrl + "/local/ubion/user";
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
    const login_alert = document.querySelector('#login-alert');

    const my_course_lists = cr.querySelector('tbody.my-course-lists');

    // if no logined, open LMS website
    if (my_course_lists == null && LMSBaseUrl != null) {
        login_alert.hidden = false;
        window.open(LMSBaseUrl + "/login.php");
    }
    login_alert.hidden = true;

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
    if(LMSBaseUrl == null) {
        return
    }

    const courseIdList = await checkCourseList(); // get course id's
    const tasks = await getTaskList(courseIdList);

    const unSubmitted = tasks.filter((task) => (task.status == false && task.missed == false));

    unSubmitted.sort((a,b) => {
        if(new Date(a.due) > new Date(b.due)) {
            return 1
        } else if (new Date(a.due) < new Date(b.due)) {
            return -1
        }
        return 0;
    })

    hideSkeleton();
    // Hide skeletons
    // const tasks_skeleton = document.querySelectorAll('.skeleton-div');
    // tasks_skeleton.forEach((skeleton) => {
    //     skeleton.hidden = true;
    // })

    const tasks_div = document.querySelector('.tasks');

    unSubmitted.forEach((unTask) => {
        const taskUrlFormer = LMSBaseUrl + "/mod/assign/view.php?id=";
        const task_div = createTaskDiv(unTask.course,unTask.due,unTask.name, unTask.id);
        task_div.addEventListener('click', (e) => {
            window.open(taskUrlFormer + task_div.id);
        })
        tasks_div.appendChild(task_div);
    })
}

async function getTaskList(courseIdList) {
    const taskUrlFormer = LMSBaseUrl + "/mod/assign/index.php?id=";
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
            var course_list = tbody_list.querySelectorAll('tr');

            for (var i = 0; i < course_list.length; i++) {
                const course = course_list[i];
                const task_name = course.querySelector('a')?.innerHTML ?? true; // String - Task name
                if(task_name == true) {
                    continue;
                }
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
            }
        }
    }

    console.log(tasks);
    return tasks
}

/**
 * Create task div for diplay at popup
 * @param {String} course Course name
 * @param {String} due Task due date
 * @param {String} name Task name
 * @param {String} id Task LMS id
 * @returns task div element
 */
function createTaskDiv(course, due, name, id) {
    const task = document.createElement('div');
    task.setAttribute('class','task');
    task.setAttribute('id',id);

    const course_name = document.createElement('a');
    course_name.setAttribute('class','course-name');
    course_name.innerHTML = course;
    const task_due = document.createElement('a');
    task_due.setAttribute('class','task-due')
    task_due.innerHTML = due;
    const task_name = document.createElement('a');
    task_name.setAttribute('class','task-name');
    task_name.innerHTML = name;

    task.appendChild(course_name);
    task.appendChild(task_due);
    task.appendChild(document.createElement('br'));
    task.appendChild(task_name);

    return task;
}

function hideSkeleton() {
    tasks_skeleton.forEach((skeleton) => {
        skeleton.hidden = true;
    })
}


// Setting control
let settingIsOn = false;
const setting_btn = document.getElementById('setting-btn');
const setting_div = document.querySelector('.setting-div');
setting_btn.addEventListener('click', () => {
    if(settingIsOn) {
        // hide
        setting_btn.querySelector('i').style.color = 'white';
        setting_div.hidden = true;
    } else {
        //show
        setting_div.hidden = false;
        setting_btn.querySelector('i').style.color = 'black';
    }
    settingIsOn = !settingIsOn;
})