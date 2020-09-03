const path = require('path');
const express = require('express');
var http = require('http');
var cp = require("child_process");
var app = express();
app.use(express.static(__dirname));
const port = 30101;


app.get('/', function(req, res){
    res.writeHead(200, { "Content-Type": "text/event-stream",
                         "Cache-control": "no-cache" });

    var spw = cp.spawn('node', ['sendmail.js']),
    str = "";
    
    spw.stdout.on('data', function (data) {
        str += data.toString();

        // just so we can see the server is doing something
        console.log("DATA: "  + data);

        // Flush out line by line.
        var lines = str.split("\n");
        for(var i in lines) {
            if(i == lines.length - 1) {
                str = lines[i];
            } else{
                // Note: The double-newline is *required*
                res.write('data: ' + lines[i] + "\n\n");
            }
        }
    });
    spw.on('close', function (code) {
        res.end(str);
    });
    spw.stderr.on('data', function (data) {
        res.end('stderr: ' + data);
    });
});

app.listen(port);