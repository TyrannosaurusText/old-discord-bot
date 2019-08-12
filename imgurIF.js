var imgurbot = require("./imgurHTTPHandler.js");
var jsonfile = require("jsonfile");
var imageList;
var fs = require('fs');
var file = './Imgur.txt';
var ImageBank = {};
var waitingforupdate = false;

exports.initialize = function () {
  ImageBank = jsonfile.readFileSync(file, 'utf8');
}

exports.draw = function (name) {
  if (name in ImageBank) {
    return ImageBank[name].link;
  }
  return "Image not found.";
}

exports.upload = function (name, url, flag) {
  if (name in ImageBank) //match with bank and replace is true
  {
    if (flag)
      imgurbot.DELETE(ImageBank[name].deletehash); //replaces the previous image
    else
      return { success: false, res: 'Name already used! Add \'-replace\' to replace' };
  }
  // console.log(url);
  if (url.search("i.imgur") != -1) {
    // console.log("match");
    var temp = url.substr(url.lastIndexOf("com/") + 4);
    var path = temp.substr(0, temp.lastIndexOf("."));
     console.log(path);
    return imgurbot.GET(name, path, url);
  }
  else
    return imgurbot.POST(name, url);
}

exports.displayImage = function () {
  //delete ImageBank.a;
   console.log(ImageBank);
}
exports.find = function (name) {
  //delete ImageBank.a;
  if(name in ImageBank)
    return true;
    console.log("in use");
    return false;
}
exports.deleteImage = function (name) {
  if (name in ImageBank) {
    if (ImageBank[name].deletehash != '0') {
      imgurbot.DELETE(ImageBank[name].deletehash);
    }
    // console.log("name: " + name);
    delete ImageBank[name];
    // console.log(ImageBank);
  }
  else return false;

}


function doUpdate() {
  // console.log(imgurbot.showMutex());
  if (imgurbot.showMutex()) {
    setTimeout(function () {
      // console.log("testing");
      doUpdate();
    }, 3000);
    return;
  }
  data = fs.readFileSync('./Update.txt', 'utf8');
  fs.writeFileSync('./Update.txt', "");
  var str = data.split("\n");
  for (index = 0; index < str.length; index++) {
    var word = str[index].split(" ");
    var temp = { link: word[1], deletehash: word[2] };
    ImageBank[word[0]] = temp;
  }
  jsonfile.writeFileSync(file, ImageBank);
  waitingforupdate = false;
}


exports.update = function () //updates the database
{
 waitingforupdate = true;
  doUpdate();
}
exports.updateDone = function()
{
  return waitingforupdate;
}