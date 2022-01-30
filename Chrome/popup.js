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
    if (typeof result.hidePastCheck === "undefined") { // if Extension is running first time
        chrome.storage.sync.set({ languageCheck: 'ko' }, function () {
            console.log('[Init setting] Language setted ko');
        });
    }
    // fetch
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
    console.log('ok');
}