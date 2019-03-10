const express = require('express')
const app = express()
const request = require('request');
var headersRequest = request.defaults({
  headers : {
    'Accept': 'application/vnd.twitchtv.v4+json',
    'Client-ID' : 'jzkbprff40iqj646a697cyrvl0zt2m6' //'5umdahxg39d3df4xvs0vbmlmurd9xoc'
  }
});

app.get('*', function(req, res, next){ 
  res.channel = req.query.channel;
  console.log(res.channel);
  res.time = Date.now();
  headersRequest.get({
        url: 'https://api.twitch.tv/kraken/channels/' + encodeURIComponent(res.channel.toLowerCase()),
        method: 'GET',
        json: true,
    }, function(err, response, json){
        if (err) return;
        if (json._id) {
          console.log(json.display_name+' is exist')
          next();
        }
        else {
          res.status(404).send('not exist');
          console.log(res.channel+' not exist')
          return;
        }
		console.log(json);
    });
},function(req, res, next){
    headersRequest.get({
        url: 'https://api.twitch.tv/kraken/streams/' +encodeURIComponent(res.channel.toLowerCase()),
        method: 'GET',
        json: true,
    }, function(err, response, json){
        if (err) return;
        if (json.stream==null) {res.status(404).send('offline');
          console.log(res.channel+' offline');
          res.status(404).send(res.channel+' offline');
          return;
        }
        else { 
          console.log(json.stream.channel.display_name+' online');
          next();
        }
    });
},function(req, res, next){
    headersRequest.get({
        url: 'https://api.twitch.tv/api/channels/' +encodeURIComponent(res.channel.toLowerCase()) + 
            '/access_token?adblock=false&need_https=true&platform=web&player_type=site',
        method: 'GET',
        json: true,
    }, function(err, response, json){
        if (err) return;
        res.json=json;
      console.log('token ok!');
        next();         
    });
},function(req, res, next){
    var url ='https://usher.ttvnw.net/api/channel/hls/' + encodeURIComponent(res.channel.toLowerCase()) + 
            '.m3u8?player=twitchweb&token=' + encodeURIComponent(res.json.token) + '&sig=' + res.json.sig + 
            '&allow_source=true&allow_audio_only=true&type=any&allow_spectre=true&player_backend=html5&p=3209689&expgroup=regular&baking_bread=false'
    console.log(url);
    request.get({
        url: url,
        method: 'GET'

    }, function(err, response, json){
      var m3u8 = json;
      console.log("response ok!");
        if(!err && m3u8.slice(0,7)!="#EXTM3U"){
          res.status(404).send('Something broke!');
          return;
           }
        if (err) {
          var redirectUrl = req.protocol+'://'+req.hostname+'/'+res.channel+'.m3u8';
          console.log('redirect url '+ redirectUrl);
            res.redirect(301, (redirectUrl));
        }
        else {
          res.set({'Content-Type':'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'});
          res.send(m3u8);
          next();
        }
    });    
    },function(req, res, next){
        console.log('done in '+(Date.now()-res.time)+' ms');
    }

)

module.exports = app
