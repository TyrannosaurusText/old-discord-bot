
var ImgurID; //stripped
var ImgurShh; // stripped
var albumid;
var fs = require('fs');
var request = require('request');
var postpath = 'https://api.imgur.com/3/image';
var deletepath = 'https://api.imgur.com/3/image/';
var request = require('request');
var writeName;
var getpath;
var postMutex = false;


function callback(error, response, body) {
  var res = JSON.parse(body);
  if(JSON.parse(body).status == 200)
  fs.appendFile('Update.txt', "\n" + writeName + " " + res.data.link + " " + res.data.deletehash, function (err) {
    if (err) {
      return console.log(err);
    }
  });
  else
  console.log(body);
  postMutex = false;
}
exports.showMutex = function ()
{
  return postMutex;
}

exports.POST = function (name, path) {
  if(postMutex )
  return {success: false, res: 'Uploader is busy, please try again later.'};
  postMutex = true;
writeName = name;
var options = { method: 'POST',
  url: 'https://api.imgur.com/3/image',
  headers: 
   { 
     'cache-control': 'no-cache',
     authorization: 'Client-ID ' + ImgurID,
     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' 
	 },
  formData: 
   { image: path,
     album: albumid } };

  request(options, callback);
  return {success: true, res: ''};
}
function getCallback(error, response, body)
{
        console.log(JSON.parse(body).status );
    if(error)
        return {status: false, message: "There was an error."}
    if(JSON.parse(body).status != '200') 
        return  {status: false, message: "There was an error."};
    fs.appendFile('Update.txt', "\n" + writeName + " " + getpath + " " + "0", function (err) {
    if (err) {
      return console.log(err);
    }
  });
    postMutex = false;

}
exports.GET = function(name, path, link)
{
  if(postMutex )
  return {success: false, res: 'Uploader is busy, please try again later.'};
  postMutex = true;
  writeName = name;
    var post = {
  url: deletepath + path,
  headers: {
     authorization: 'Client-ID ' + ImgurID,
  }
}
  getpath = link; // saving for callback
   request(post, getCallback);
  return {success: true, res: ''};
}
function deleteCallback(error, response, body) {

  //var res = JSON.parse(body);

}
exports.DELETE = function (deletehash) {
  var del = {
    method: 'DELETE',
    url: deletepath + deletehash,
    headers: {
     authorization: 'Client-ID ' + ImgurID,
    }
  };
  request(del, deleteCallback);
}
