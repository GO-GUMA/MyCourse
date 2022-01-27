(() => {
    function closeSocket() {
        window.socket && window.socket.close()
    }

    function blockDetectMultiPlayer() {
        Object.defineProperty(window, 'remote_vod_pause', {
            writable: false,
            value: closeSocket
        })
        closeSocket()
    }

    blockDetectMultiPlayer();
})()