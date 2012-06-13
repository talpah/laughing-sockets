var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');
var Tail = require('tail').Tail;
var tail = new Tail("/var/log/syslog");

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_echo = sockjs.createServer(sockjs_opts);
var conn_list = [];
var watcher_list = [];

tail.on("line", function(data) {
	for (cconn in watcher_list) {
		watcher_list[cconn].write(data);
	}
});

sockjs_echo.on('connection', function(conn) {
    conn_list.push(conn);
    for (cconn in conn_list) {
     	conn_list[cconn].write(conn.id + ' just connected.');
    }

    conn.on('data', function(message) {
	var response = false;
	switch (message) {
		case "/clients":
			var response = [];
			for (cconn in conn_list) {
				response.push(conn_list[cconn].id);
			}
			conn.write(response);
			response = false;
		break;
		case "/unwatch":
			var temp_watchers = [];
			for (watcher in watcher_list) {
				if (watcher_list[watcher].id != conn.id) {
					temp_watchers.push(watcher_list[watcher]);
				}
			}
			watcher_list = temp_watchers;
			conn.write('You stopped watching the log.');
                        response = conn.id + ' stopped watching the log.';
		break;
		case "/watch":
			watcher_list.push(conn);
                        conn.write('You are now watching the log.');
			response = conn.id + ' is now watching the log.';
		break;
		default:
			response = message;
		break;
	}
	if (response) {
		for (cconn in conn_list) {
       		 	conn_list[cconn].write(response);
		}
	}
    });
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
    res.end();
});

sockjs_echo.installHandlers(server, {prefix:'/echo'});

console.log(' [*] Listening on 0.0.0.0:9999' );
server.listen(9999, '0.0.0.0');

