const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const speech = require('@google-cloud/speech');
const fs = require('fs');
const google = require('googleapis');

const projectId = 'static-retina-192310';

// Creates a client
// const client = new speech.SpeechClient({
//   projectId: projectId
// });

const client = new speech.SpeechClient();

// The name of the audio file to transcribe
const fileName = './audio/test1.mp3';

// Reads a local audio file and converts it to base64
const file = fs.readFileSync(fileName);
const audioBytes = file.toString('base64');

console.log(audioBytes);

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const audio = {
  content: audioBytes,
};
const config = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'uk-UA',
};
const request = {
  audio: audio,
  config: config,
};

// Detects speech in the audio file
client
  .recognize(request)
  .then(data => {
    const response = data[0];
    console.log("Data: " + JSON.stringify(data));
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log(`Transcription: ${transcription}`);
  })
  .catch(err => {
    console.error('ERROR OCCURED:', err);
  });


server.set('view engine', 'ejs');
server.get('/', function (req, res) {
    res.render('pages/googleSpeech');
});
server.get('/test', function (req, res) {
    res.render('pages/index');
});
server.use(express.static('audio'));

var connectCounter = 0;
io.on('connection', function (socket) {

    connectCounter++;
    io.emit('connections', connectCounter);

    socket.on('disconnect', function () {
        connectCounter--;
        io.emit('connections', connectCounter);
    });

    socket.on('message', function (buffer) {
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
    socket.on('stop', function () {
        console.log('socket:stop ' + Date.now());
    });
});

http.listen(8080, function () {
    console.log('8080 is the magic port');
});
