var express = require('express');
var app = express();

var path = __dirname + '/public';
var port = 8083;

app.use(express.static(path));
app.get('*', function(req, res) {
    res.sendFile(path + '/index.html');
});
console.log(`Serving ${path} at http://127.0.0.1:${port}`);
app.listen(port);
