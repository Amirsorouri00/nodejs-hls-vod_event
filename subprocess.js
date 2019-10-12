const fs = require('fs');
const express = require('express');

var async = require("async");
const readline = require('readline');
var ffmpegs = require('fluent-ffmpeg');
const textVar='amirsorouri00'
const fileDirs = '/home/amirsorouri/Desktop/stream/mohsen/zood'; // Directory that input files are stored
const movieLocs = '/home/amirsorouri/Desktop/stream/mohsen/zood/zood.mp4'; // Directory that input files are stored
const readInterface = readline.createInterface({
  input: fs.createReadStream(fileDirs+'/keyFrameTimeList.txt'),
  console: true
});

var app = express();


var mapStart = new Map();
console.log(mapStart); 
var mapEnd = new Map(); 


async function init(){
  let ii = 0;
  await readInterface.on('line', function (line) {
    mapStart.set("stream".concat(ii).concat(".ts"), line)
    if(ii==0)
      console.log("hereeeeeeeeeeee", mapStart)
    if (ii > 0) 
      mapEnd.set("stream".concat(ii - 1).concat(".ts"), line)
    ii++
  });
}


function watermarker(proc) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(proc.run());
    }, 2000);
  });
}

async function try_to_watermark(proc){
  await watermarker(proc);
}


process.on('message', (m) => {
    if (m === 'server') {
      convert();
    }
    else if(m === 'segment') {
        const args = process.argv
        mapStartstr = args[2]
        mapEndstr = args[3]
        const movieLocs = args[4]
        const sgStartNo = args[5]
        const movieDir = args[6]
        const textVar = args[7]

        mapStart = new Map(JSON.parse(mapStartstr))
        mapEnd = new Map(JSON.parse(mapEndstr))

        console.log(sgStartNo);
        var head = Number(sgStartNo);
        if (head != 1){
          head = head + 2;
        }

        for (;head<6;head = head+9){
          var tmp = head;
          for(var i = 0;i<3;i++){
            final = 'stream'.concat(tmp).concat('.ts');
            // console.log(mapStart.get(final), final, sgStartNo)
            console.log(final, mapEnd.get(final))
            tmp++;
            var proc = convert_segment_vod(mapStart.get(final), mapEnd.get(final), movieLocs, final, textVar);
            try_to_watermark(proc).then(() => {
              console.log("SUBPROCESS ", sgStartNo, ": ",final, " now exist.");
            })
            
          }
        }
        
      
    }
    else{
      console.log("wrong messege");
    }
});

function convert_segment_vod(mapStart, mapEnd, movieLocs, final, textVar){
    var proc = ffmpegs(movieLocs) 
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
        '-ss '.concat(mapStart),
        '-itsoffset '.concat(mapStart)
      ])
      .addOptions([
        '-acodec copy' 
      ]) 
      .format('mpegts')
      .addOptions([
        '-t '.concat(mapEnd)
      ])
      .on('end', function (stdout, stderr) {
        console.log('SUBPROCESS: Transcoding succeeded !', movieLocs, final);
      })
      .on('error', function (err) {
        console.log('SUBPROCESS: an error happened: ' + err.message);
      })
      .output(fileDirs+'/'+final)
      // .pipe(res)
      return proc;
}
