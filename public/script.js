const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    host: window.location.hostname, // Use the current hostname
    port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80), // Use the current port or default ports (443 for HTTPS, 80 for HTTP)
    path: '/peerjs', // Specify the path to the PeerJS server
    secure: window.location.protocol === 'https:', // Use secure connection based on the current protocol
});


const peers = {};

myPeer.on('open', id => {
    document.getElementById('user-id').innerText = 'Your User ID: ' + id;
    socket.emit('join-room', ROOM_ID, id);
});

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
}).then(stream => {
    addVideoStream(myPeer.id, stream);
    myPeer.on('call', call => {
        call.answer(stream);
        call.on('stream', userVideoStream => {
            const userId = call.peer;
            addVideoStream(userId, userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        const call = myPeer.call(userId, stream);
        call.on('stream', userVideoStream => {
            addVideoStream(userId, userVideoStream);
        });
        peers[userId] = call;
    });
});

socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
        const videoElement = document.getElementById(userId);
        if (videoElement) {
            videoElement.parentElement.remove();
        }
    }
});

function addVideoStream(userId, stream) {
    if (!stream) return;
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('id', userId);
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    const videoContainer = document.createElement('div');
    videoContainer.appendChild(video);
    const userIdDisplay = document.createElement('span');
    userIdDisplay.innerText = userId;
    videoContainer.appendChild(userIdDisplay);
    videoGrid.append(videoContainer);
}
