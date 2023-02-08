const http = require("http");
// const server = new http.createServer();
// const concat = require('concat-stream');
const qs = require('querystring');


const express = require("express"),
      app = express()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const multer = require("multer");
const os = require("os");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
// const upload = multer({storage})
// const upload = multer({ dest: os.tmpdir() });
const upload = multer({storage:multer.memoryStorage()});

const fs = require("fs");


function readHTML (fname) {
    return fs.readFileSync("files/" + fname, "utf8")
}

function sendHTML (str, respond) {
    respond.writeHead(200, {"content-type": "text/html"});
    respond.write(str);
    respond.end();
}

var dynList = []

dynList.insert = function(s, limit=100) {
    let s_escaped = s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    this.unshift(`<li onclick="clickBehavior(this);"><pre>${s_escaped}</pre></li><br/>`)
    while (this.length > limit)
        this.pop();
    return this;
}

dynList.insertFile = function(s, comment, limit=100) {
    function escapize(sr) {
        return sr.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
    }
    this.unshift(`<li onmousedown="clickBehavior(this);"><a href="/pasbase-download/${s}">${escapize(s)}</a><pre>${escapize(comment)}</pre></li><br/>`)
    while (this.length > limit)
        this.pop();
    return this;
}


"Yo ho ho!And a bottle of rum!".repeat(4).split("!").reduce((l, s) => l.insert(s), first=dynList)


var dynFiles = []

dynFiles.insert = function(f, limit=30) {
    this.unshift(f);
    while (this.length > limit) {
        this.pop();
    }
    return this;
}


function listPage(req, res) {
    var reqList = req.url.split("/").filter(s => s.length > 0);
    ind = reqList.findIndex(s => s.endsWith("file"))
    let str = readHTML(reqList[ind + 1]);
    let strList = dynList.join("\n");
    let strRes = str.replace("awaiting-replacement", dynList.join("\n")) 
    sendHTML(strRes, res);
}

app.get(/-file/, (req, res) => {
    listPage(req, res)
})

//app.post(/file/, upload.single('optionalfile'), (req, res) => {
app.post(/-file/, upload.array('optionalfile', 15), (req, res) => {
    var data = req.body;
    var files = req.files;
    console.log("new clip body: ", data);
    console.log("new clip files: ", files.length);
    if (files.length == 0) {
        dynList.insert(data.newclip);
    }
    for (f of files){
        f.originalname = Buffer.from(f.originalname, "latin1").toString("utf8");
        dynFiles.insert(f);
        dynList.insertFile(f.originalname, data.newclip);
    }

    listPage(req, res)
})


function fileWithName(fname) {
    fname = decodeURIComponent(fname);
    for (f of dynFiles) {
        if (f.originalname == fname) {
            console.log("Download Hit:", fname, f);
            return f;
        }
    }
    return null;
}
function respdown(f, res) {
    res.writeHead(200, {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(f.originalname)}"`,
        'Content-Type': "application/octet-stream",
    })
    if (f)
        res.end(f.buffer);
    else
        res.end(dynFiles.map(f => f.originalname));
}


app.get(/-download/, (req, res) => {
    var reqList = req.url.split("/").filter(s => s.length > 0);
    ind = reqList.findIndex(s => s.endsWith("download"));
    if (reqList[1]) {
        var f = fileWithName(reqList[ind + 1]);
        respdown(f, res)
    }
})

app.get(/-cancelast/, (req, res) => {
    dynList.shift();
    res.writeHead(302, {location: "/pasbase-file/index.html"} );
    res.end();
})

app.get(/.*/, (req, res) => {
    res.writeHead(302, {location: "/pasbase-file/index.html"});
    res.end();
})
/*
*/

/*
server.on("request", (req, res) => {
    var reqList = req.url.split("/").filter(s => s.length > 0);
    if (reqList[0] == "file" && reqList[1] && reqList[1].endsWith(".html")){
        if (req.method === "POST") {
            var newclip = '';
            req.on("data", function(data) {
                // console.log("new data chunk: ", qs.parse(data.toString()));
                newclip = newclip + data;
            });
            req.on("end", function() {
                var data = qs.parse(newclip.toString());
                console.log("new clip: ", data);
                dynList.insert(data.newclip);
                let str = readHTML(reqList[1]);
                let strList = dynList.join("\n");
                let strRes = str.replace("awaiting-replacement", dynList.join("\n")) 
                sendHTML(strRes, res);
            });
        }
        else {
            let str = readHTML(reqList[1]);
            let strList = dynList.join("\n");
            let strRes = str.replace("awaiting-replacement", dynList.join("\n")) 
            sendHTML(strRes, res);
        }
    }
    else {
        res.writeHead(302, {location: "/file/index.html"});
        res.end("[200] No comment in response to :\n " + JSON.stringify(reqList))
    }
    
}).listen(5678, "127.0.0.1")
*/
// app.listen(8818, "0.0.0.0", () => console.log("Running in 0.0.0.0:8818\n"))
app.listen(8818, () => console.log("Running in 0.0.0.0:8818\n"))
