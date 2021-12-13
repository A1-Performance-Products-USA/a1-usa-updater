const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const fs = require("fs");
const https = require("https");

//app.use(express.static(path.join(__dirname, 'static'), {dotfiles: 'allow'}));


app.get('*', (req, res) => {
     res.send("You aren't supposed to be here!");
})

app.post('/listener/query', (req, res) => {
     res.send("Correct")
})

//app.use(express.static(path.join(__dirname, 'static'), { dotfiles: 'allow' } ));


app.get("/", function (req, res) {
  res.send("hello world");
});

https.createServer(
     {
          key: fs.readFileSync(path.join(__dirname, 'ssl', 'privkey.pem')),
          cert: fs.readFileSync(path.join(__dirname, 'ssl', 'fullchain.pem')),
     },
     app
).listen(port, function () {
     console.log(
          "App listening on port 3000! Go to https://localhost:3000/"
     );
});
