var Handler = {
  'expectResult' : function (what) {
    var cites = document.querySelectorAll("cite");
    var found = false;
    for (var c = 0; !found && c < cites.length; c++) {
      if (cites[c].textContent.replace(/^\/|\/$/, '') === what)
        found = true;
    }
    window.runner.send({
      'success': found
    });
  }
};

window.runner.handler = Handler;
