const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const speech = require('@google-cloud/speech');
const fs = require('fs');
const google = require('googleapis');

const client = new speech.SpeechClient();

const config = {
  encoding: 'LINEAR16',
  sampleRateHertz: 45000,
  languageCode: 'uk-UA',
};

/* GOOGLE SPEECH API CONFIG */
const projectId = 'static-retina-192310';

// // The audio file's encoding, sample rate in hertz, and BCP-47 language code


/* TEST FOR GOOGLE SPEECH API */
// The name of the audio file to transcribe
const fileName = './audio/my_raw5.raw';


// Reads a local audio file and converts it to base64
const file = fs.readFileSync(fileName);

const audioBytes = file.toString('base64');

const audio = {
  content: audioBytes,
};

const request = {
  audio: audio,
  config: config,
};

console.log(audioBytes);

//Detects speech in the audio file
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

/* WEB SERVER CONFIG */
server.set('view engine', 'ejs');
server.get('/', function (req, res) {
  res.render('pages/googleSpeech');
});
server.get('/test', function (req, res) {
  res.render('pages/index');
});
server.use(express.static('audio'));

/* WEBSOCKET CONFIG */
var connectCounter = 0;
var dataBuffer = null;

io.on('connection', function (socket) {

  connectCounter++;
  io.emit('connections', connectCounter);

  socket.on('disconnect', function () {
    connectCounter--;
    io.emit('connections', connectCounter);
  });

  socket.on('message', function(msg){
    io.emit('message', msg);
  });

  socket.on('voice', function (buffer) {

    //let newChunk = new Buffer(buffer).toString('base64');
    //base64Buffer += newChunk;

    // console.log(newChunk);
    // console.log("------");

    // var request = { audio: { content:  base64Buffer }, config: config };

    // client
    //   .recognize(request)
    //   .then(data => {
    //     const response = data[0];
    //     console.log("Data: " + JSON.stringify(data));
    //     const transcription = response.results
    //       .map(result => result.alternatives[0].transcript)
    //       .join('\n');

    //     console.log("Message: " + transcription);
    //     io.emit('message', transcription);
    //   })
    //   .catch(err => {
    //     console.error('ERROR:', err);
    //   });

    dataBuffer = (dataBuffer === null) ? new Buffer(buffer) : Buffer.concat([dataBuffer, new Buffer(buffer)]);
  });

  socket.on('stop', function () {

    let base64Buffer = dataBuffer.toString('base64');
    console.log(base64Buffer);

    var request = { audio: { content: base64Buffer }, config: config };

    client
      .recognize(request)
      .then(data => {
        const response = data[0];
        console.log("Data: " + JSON.stringify(data));
        const transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');

        console.log("Message: " + transcription);
        io.emit('message', transcription);
        dataBuffer = null;
      })
      .catch(err => {
        console.error('ERROR:', err);
      });

    console.log('socket:stop ' + Date.now());
  });
});

http.listen(8080, function () {
  console.log('8080 is the magic port');
});
