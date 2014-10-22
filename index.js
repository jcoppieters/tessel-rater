var tessel = require('tessel');

var http = require('http');
var url = require('url');

var servolib = require('servo-pca9685');
var servoSystem = servolib.use(tessel.port['A']);


// Param prototype object
function Param(Q, Y, N, servo) {
  this.Q = Q; this.Y = Y; this.N = N;
  this.YCnt = 0; this.NCnt = 0;
  this.servo = servo;
}
Param.prototype.reset = function() {
  // clear Y and N counters
  this.YCnt = 0; this.NCnt = 0;
  return this;
}
Param.prototype.read = function(obj, name) {
  // read ourselfs from a http query object
  this.Q = obj[name]; this.Y = obj[name+"Y"]; this.N = obj[name+"N"];
  return this;
}
Param.prototype.add = function(choice) {
  if (choice == "Y") this.YCnt++;
  if (choice == "N") this.NCnt++;
  return this;
};
Param.prototype.render = function() {
  // set the servo to a position 0..1 (0.5 if there are no votes received yet)
  var total = this.YCnt+this.NCnt;
  servoSystem.move(this.servo, ((total == 0) ? 0.5 : this.YCnt / total));
  return this;
};


// set green led, clear blue
tessel.led[0].output(1);
tessel.led[1].output(0);

// make 2 param objects
var A = new Param("Question 1", "Yes", "No", 1);
var B = new Param("Question 2", "Good", "Bad", 2);


servoSystem.on('ready', function () {
  
  // configure servo 1 & 2
  servoSystem.configure(A.servo, 0.04, 0.13, function () {
  servoSystem.configure(B.servo, 0.04, 0.13, function () {
    
    // set to initial position
    A.render();
    B.render();
    
    var server = http.createServer(function (req, res) {
  
      // parse url into and object,
      // parse also query string (true as 2nd param)
      var urlObj = url.parse(req.url, true);
      var pathname = urlObj.pathname;
      
      
      // serving a home page
      if (pathname == '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(homepage(), 'utf8');
        res.end();
        return;
        
        
      // serving an admin page
      } else if (pathname == '/admin') {

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(adminpage(), 'utf8');
        res.end();
        return;
        
        
      // accepting commands
      } else if (typeof urlObj.query != "undefined") {
        var cmd = urlObj.query.request;
        res.writeHead(200, {'Content-Type': 'text/html'});
        
        // user entered a vote
        if (cmd == 'Vote') {
          A.add(urlObj.query.A).render();
          B.add(urlObj.query.B).render();
          res.write(homepage('Thanks for voting'), 'utf8');
        
        // administrator changed the question + reset the counters
        } else if (cmd == 'Save') {
          A.read(urlObj.query, "A").reset().render();
          B.read(urlObj.query, "B").reset().render();
          res.write(homepage('Parameters saved'), 'utf8');

          
        } else {
          res.write('<!DOCTYPE html><html>Illegal command -- Go play somewhere else!</html>', 'utf8');
        }
        res.end();
        return;
      }
      
      // not "/" or "/admin", so generate page-not-found
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.write('<html>Sorry this is not the page you are looking for</html', 'utf8');
      res.end();
      
    });

    // have the server listen for incoming requests
    server.listen(80);
    
    // clear green led, set blue led
    tessel.led[0].output(0);
    tessel.led[1].output(1);
      
  });
  });
});


function style() {
  return "<style>" +
     "body { background-color: #eeeeee }" +
     "div { display: block; margin-bottom: 5px; }" +
     "label { display: inline-block; margin: 3px 5px 3px 5px }" +
     "label:first-child { margin-right: 10px }" +
     "input[type=text] { display: inline-block; width: 200px }" +
     "h1 { background-color: darkblue; color: white; padding: 5px }" +
     "h2 { background-color: darkred; color: white; margin: 5px 0; padding: 5px }" +
     "form { display: block; width: 500; margin: 5px auto }" +
    "</style>\n";
}

// webpages - admin
function adminpage(message) {
  function ask(name, P) {
    return  "<div><label for='A'>Question " + name + "</label>" +
              "<input type=text name='" + name + "' value='" + P.Q + "' id='" + name + "'>" +
            "</div>" +
            "<div><label for='" + name + "Y'>- 1: </label>" +
              "<input type=text name='" + name + "Y' value='" + P.Y + "' id='" + name + "Y'>" +
            "</div>" +
            "<div><label for='" + name + "N'>- 2: </label>" +
              "<input type=text name='" + name + "N' value='" + P.N + "' id='" + name + "N'>" +
            "</div>\n";
  }

  message = (typeof message == "undefined") ? "" : "<h2>" + message + "</h2>";
  
  return "<!DOCTYPE html>\n<html language='en'><head>" + style() + "</head>" +
    "<body>" +
      "<h1>Change questions and reset the counters</h1>" + message +
      "<form action='/do' method='get'>\n" +
      ask("A", A) +
      ask("B", B) +
      "\n<input type=submit name='request' value='Save'>" +
    "</form></body></html>\n\n";
}

// webpages - home questionaire
function homepage(message) {
  message = (typeof message == "undefined") ? "" : "<h2>" + message + "</h2>";
  
  return "<!DOCTYPE html>\n<html language='en'><head>" + style() + "</head>" +
    "<body>" +
      "<h1>Please select your answers and click on 'Vote'</h1>" + message +
      "<form action='/do' method='get'>" +
      "<div><label for='A'>" + A.Q + "</label>" +
         "<input type=radio name='A' value='Y' id='AY'><label for='AY'>" + A.Y + "</label>" +
         "<input type=radio name='A' value='N' id='AN'><label for='AN'>" + A.N + "</label></div>" +
      "<div><label for='B'>" + B.Q + "</label>" +
         "<input type=radio name='B' value='Y' id='BY'><label for='BY'>" + B.Y + "</label>" +
         "<input type=radio name='B' value='N' id='BN'><label for='BN'>" + B.N + "</label></div>" +
      "<input type=submit name='request' value='Vote'>" +
    "</form></body></html>\n\n";
}
