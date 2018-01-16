const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const speech = require('@google-cloud/speech');

// Your Google Cloud Platform project ID
// const projectId = 'your-project-id';
// const client = new speech.SpeechClient({
//     projectId: projectId,
// });
// const config = {
//     encoding: 'LINEAR16',
//     sampleRateHertz: 16000,
//     languageCode: 'en-US',
// };

server.set('view engine', 'ejs');
server.get('/', function(req, res) {
    res.render('pages/googleSpeech');
});
server.get('/test', function(req, res) {
    res.render('pages/index');
});
server.use(express.static('audio'));

var connectCounter = 0;
io.on('connection', function(socket){

    connectCounter++; 
    io.emit('connections', connectCounter);

    socket.on('disconnect', function() { 
        connectCounter--;
        io.emit('connections', connectCounter);
    });

    socket.on('message', function(buffer){
        var base64 = new Buffer(buffer).toString('base64')
        //console.log('sample: ' + base64);
        //var request = { audio: { content: base64 }, config: config };
        // client.recognize(request)
        //     .then(data => {
        //         var response = data[0];
        //         var transcription = response.results
        //             .map(result => result.alternatives[0].transcript).join('\n');
        //         console.log(`Transcription: ${transcription}`);
        //     })
        //     .catch(err => {
        //         console.error('ERROR:', err);
        //     });
        io.emit('message', buffer);
    });
    socket.on('stop', function(){
        console.log('socket:stop ' + Date.now());
    });
  });

http.listen(8080, function(){
    console.log('8080 is the magic port');
});
