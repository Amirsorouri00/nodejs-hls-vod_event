const HLSServer = require('hls-server')
const http = require('http')
const express = require('express');
var fs = require('fs')
var app = express();

const fileDirs = '/home/amirsorouri/Desktop/stream/mohsen/zood'; // Directory that input files are stored
const movieLocs = '/home/amirsorouri/Desktop/stream/mohsen/zood/zood.mp4'; // Directory that input files are stored

var fs = require('fs')
textVar='amirsorouri00'
var ffmpeg = require('fluent-ffmpeg');
const readline = require('readline');
const readInterface = readline.createInterface({
  input: fs.createReadStream(fileDirs+'/keyFrameTimeList.txt'),
  console: false
});

var mapStart = new Map(); 
var mapEnd = new Map();
 
let ii = 0;
readInterface.on('line', function (line) {
  mapStart.set("stream".concat(ii).concat(".ts"), line)
  if(ii==0)
  {
    console.log(mapStart)
  }
  if (ii > 0) {
    mapEnd.set("stream".concat(ii - 1).concat(".ts"), line)

  }
  ii++
});


const server = http.createServer(app)

const hls = new HLSServer(server, {
  path: '/streams', // Base URI to output HLS streams
  dir: fileDirs,    // Directory that input files are stored
  provider: {
    exists: function (req, callback) { 
      // check if a file exists (always called before the below methods)
      
      callback(null, true) // File exists and is ready to start streaming
      // callback(new Error("Server Error!")) // 500 error
      // callback(null, false)                // 404 error
    },
    getManifestStream: function (req, callback) { // return the correct .m3u8 file
      // "req" is the http request
      // "callback" must be called with error-first arguments

      callback(null, fs.createReadStream(req.filePath))
      // or
      // callback(new Error("Server error!"), null)
    },
    getSegmentStream: function (req, callback) { // return the correct .ts file
      
      var string = req.filePath;
      var result = string.split('/');
      var final = result[result.length -1];
      console.log('its final',final)
      console.log(mapStart.get(final))
      
      var proc = ffmpeg(movieLocs) 
      .videoFilters({
        filter: 'drawtext',
        options: {
          text: textVar,
          fontsize: 36,
          fontcolor: 'white',
          x: '(main_w/2-text_w/2)',
          y: '(text_h/2)+15',
          shadowcolor: 'black',
          shadowx: 2,
          shadowy: 2
        }
      })
      .videoCodec('libx264')
      .inputOption([
        '-ss '.concat(mapStart.get(final)),
        '-itsoffset '.concat(mapStart.get(final))
      ])
      .addOptions([
        '-acodec copy' 
      ]) 
      .format('mpegts')
      .addOptions([
        '-t '.concat(mapEnd.get(final))
      ])
      .on('end', function (stdout, stderr) {
        console.log('Transcoding succeeded !', req.filePath);
      })
      .on('error', function (err) {
        console.log('an error happened: ' + err.message);
      })
      // .pipe(res)

      callback(null, proc)
    }

  }
});

var httpAttach = require('http-attach')

function yourMiddleware(req, res, next) {
  // set your headers here
  res.setHeader('Access-Control-Allow-Origin', '*');
  next()
}
httpAttach(server, yourMiddleware)

server.listen(8182, () => {
  console.log('success');
});