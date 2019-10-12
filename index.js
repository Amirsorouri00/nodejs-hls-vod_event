const fs = require('fs');
const http = require('http');
const sleep = require('sleep');
const express = require('express');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const HLSServer = require('hls-server');
const subprocess = require('child_process');

const textVar='amirsorouri00'
const fileDirs = '/home/amirsorouri/Desktop/stream/mohsen/zood'; // Directory that input files are stored
const movieLocs = '/home/amirsorouri/Desktop/stream/mohsen/zood/zood.mp4'; // Directory that input files are stored
const readInterface = readline.createInterface({
  input: fs.createReadStream(fileDirs+'/keyFrameTimeList.txt'),
  console: false
});

var app = express();

var mapStart = new Map();
console.log(mapStart); 
var mapEnd = new Map(); 
let ii = 0;
readInterface.on('line', function (line) {
  mapStart.set("stream".concat(ii).concat(".ts"), line)
  if(ii==0)
    console.log(mapStart)
  
  if (ii > 0) 
    mapEnd.set("stream".concat(ii - 1).concat(".ts"), line)
  
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

      var rhhh = num_subst(final);
      console.log('ts number: ',rhhh);

      if (fs.existsSync(req.filePath)) {
        // Do something
        console.log('yohooooooo file exists', req.filePath);
        callback(null, fs.createReadStream(req.filePath))
        // subprocessor(Number(rhhh));
      }
      else{
        console.log('eybabaaaaa nabood kee');
        final = 'stream'.concat(rhhh).concat('.ts');
        var proc = ffmpeg_vodTSProvider(movieLocs, final);
        
        var tmp = Number(rhhh);
        eybaba_subprocessor(tmp);
        sleep.msleep(3000);

        callback(null, proc);        
      }
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


function num_subst(st) {
  var substr = st.replace('stream', '').replace('.ts', '');
  return substr;
}

function eybaba_subprocessor(tsNo){
  tmp = tsNo;
  for (var i = 0; i<3;i++, tmp++) {

    final = 'stream'.concat(tmp).concat('.ts');
    if (fs.existsSync(fileDirs+'/'+final)) {
      // Do something
      console.log('another process doing it.')
      continue;
    }
    else{
      // console.log(i, tmp, final, mapStart.get(final));
      var mapStartstr = JSON.stringify(Array.from( mapStart.entries()));
      var mapEndstr = JSON.stringify(Array.from( mapEnd.entries()));
      sbproc = subprocess.fork('subprocess.js', [mapStartstr, mapEndstr, 
        movieLocs, tmp, fileDirs, textVar]);
      sbproc.send('segment');
    }
    
  }
}

function subprocessor(tsNo){
  var tmp = tsNo;
  console.log("---------- tmp = ", tmp, "------------")
  for (var i = 3*(tmp-1) + 1; i<3*(tmp-1)+3 && i <= 5; i++) {
    final = 'stream'.concat(i).concat('.ts');
    if (fs.existsSync(fileDirs+'/'+final)) {
      // Do something
      console.log('SUBPROCESSOR: another process doing it.')
      continue;
    }
    else{
     
      console.log(i, tmp, final, mapStart.get(final));
      sbproc = subprocess.fork('subprocess.js', [mapStart.get(final), mapEnd.get(final), 
        movieLocs, tmp, fileDirs, textVar]);
      sbproc.send('segment');
    }
    
  }
}

function ffmpeg_vodTSProvider(movie, final){
  var proc = ffmpeg(movie) 
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
        console.log('Transcoding succeeded !', fileDirs);
      })
      .on('error', function (err) {
        console.log('an error happened: ' + err.message);
      })
      // .pipe(res)
      return proc;
}