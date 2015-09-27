var child_process = require("child_process");

child = child_process.fork(__dirname + "/inmocha/phantomjs.js", ['--webSecurityEnabled', 'false']);

setTimeout(function () { child.send({ action: 'open', url: 'http://lukas-prokop.at/' }); }, 500);
setTimeout(function () { child.send({ action: 'run', testsuite: {'when': []} }); }, 4000);

child.on('message', function (m) {
  if (m.state === 'browserStarted')
    console.log("Child yields: browser has started");
  else if (m.state === 'browserFinished')
    console.log('Child yields: browser has finished' + m.message);
  else if (m.state === 'browserFailed')
    console.log('Child yields: browser failed: ' + m.error);
  else
    console.log("Unknown message received from child: " + JSON.stringify(m));
});

child.on('exit', function() {
  process.exit();
});