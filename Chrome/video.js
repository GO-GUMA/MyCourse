var closeVideoAutoBoolean = false; // Boolean => is user checked '영상 자동종료' 
var langaugeSet = ['[재생준비] ','[일시정지] ','[재생중] ','[재생완료] '];

// Get data from sync storage
chrome.storage.sync.get('closeVideoAuto', function (result) {
    if (result.closeVideoAuto) {
        closeVideoAutoBoolean = true;
    } else {
        closeVideoAutoBoolean = false;
    }
    // console.log('Auto close is ' + closeVideoAutoBoolean);
});

// Get language check status data from storage
chrome.storage.sync.get('languageCheck', function (result) {
    if (typeof result.languageCheck === "undefined") { // if Extension is running first time
        chrome.storage.sync.set({ languageCheck: 'ko' }, function () {
            console.log('[Init setting] Language setted ko');
        });
    }

    if (result.languageCheck == 'en') {
        langaugeSet = ['[Ready] ','[Paused] ','[Playing] ','[Complete] '];
    } else {
        langaugeSet = ['[재생준비] ','[일시정지] ','[재생중] ','[재생완료] '];
    }
    document.title = langaugeSet[0] + basedTitle; // Add video title to '[재생준비]'
});

function videoTitle() { // function videoTitle() => change video title
    var basedTitle = document.title; // Get current video title
    document.title = langaugeSet[0] + basedTitle; // Add video title to '[재생준비]' or '[Ready]'

    var target = document.getElementById('vod_player'); // Set target to Observing video status

    var observer = new MutationObserver(mutations => { // create new MutationObserver object
        mutations.forEach(() => {
            if (target.classList[2] == 'jw-state-paused') { // If video is paused
                document.title = langaugeSet[1] + basedTitle; // Cahnge video title to '[일시정지]' or '[Paused]'
            } else if (target.classList[2] == 'jw-state-playing') { // If video is playing
                document.title = langaugeSet[2] + basedTitle; // Cahnge video title to '[재생중]' or '[Playing]'
            } else if (target.classList[2] == 'jw-state-complete') { // If video is done
                document.title = langaugeSet[3] + basedTitle; // Cahnge video title to '[재생완료]' or '[Complete]'
                observer.disconnect(); // Close observer

                if(closeVideoAutoBoolean) { // If user doesn't want auto close
                    closeVideo(); // function closeVideo() => close video
                }
            }
        })
    })

    var config = { // Observer config
        childList: false,
        attributes: true,
        characterData: false,
        subtree: false,
        attributeOldValue: false,
        characterDataOldValue: false
    };

    observer.observe(target, config); // set Observer
}

function closeVideo() { // function close video => close video window 
    const random_Sec = Math.floor(Math.random() * 11) // get random int 1~10
    // console.log('This window close in ' + (random_Sec) + ' seconds');
    setTimeout(() => window.close(), random_Sec * 1000); // Close window after 'random_Sec' seconds
}

function insertScript() { // function insertScript => for multiple play 
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('video_player.js');
    document.body.appendChild(script);
}

videoTitle();
insertScript();