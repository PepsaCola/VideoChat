const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

app.get('/', (req, res) => {
    res.send('Node-WebRTC Server is running');
});

let peers = {};

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    const peer = new RTCPeerConnection();
    peers[socket.id] = peer;

    peer.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', socket.id, event.candidate);
        }
    };

    socket.on('offer', async (id, description) => {
        await peer.setRemoteDescription(new RTCSessionDescription(description));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', id, peer.localDescription);
    });

    socket.on('answer', async (id, description) => {
        await peer.setRemoteDescription(new RTCSessionDescription(description));
    });

    socket.on('candidate', async (id, candidate) => {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('disconnect', () => {
        delete peers[socket.id];
        console.log('A user disconnected:', socket.id);
    });
});



server.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
