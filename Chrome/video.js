var closeVideoAutoBoolean = false; // Boolean => is user checked '영상 자동종료' 

// Get data from sync storage
chrome.storage.sync.get('closeVideoAuto', function (result) {
    if (result.closeVideoAuto) {
        closeVideoAutoBoolean = true;
    } else {
        closeVideoAutoBoolean = false;
    }
    // console.log('Auto close is ' + closeVideoAutoBoolean);
});

function videoTitle() { // function videoTitle() => change video title
    var basedTitle = document.title; // Get current video title
    document.title = '[재생준비] ' + basedTitle; // Add video title to '[재생준비]'

    var target = document.getElementById('vod_player'); // Set target to Observing video status

    var observer = new MutationObserver(mutations => { // create new MutationObserver object
        mutations.forEach(() => {
            if (target.classList[2] == 'jw-state-paused') { // If video is paused
                document.title = '[일시정지] ' + basedTitle;
            } else if (target.classList[2] == 'jw-state-playing') { // If video is playing
                document.title = '[재생중] ' + basedTitle;
            } else if (target.classList[2] == 'jw-state-complete') { // If video is done
                document.title = '[재생완료] ' + basedTitle;
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