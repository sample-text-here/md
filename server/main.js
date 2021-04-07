const http = require("http");
const fs = require("fs");
const path = require("path");

class Server {
	constructor() {
		this.map = new Map();
		this.handlers = new Map();
		this.server = http.createServer(this.handle.bind(this));
	}

	handle(req, res) {
		const file = path.basename(req.url);
		const method = req.method.toUpperCase();
		if (method === "GET" && this.map.has(file)) {
			const fromMap = this.map.get(file);
			return res
				.writeHead(200, { "Content-Type": fromMap.type })
				.end(fromMap.fmt);
		}
		if (this.handlers.has(method)) {
			return this.handlers.get(method)(req, res);
		}
		res.writeHead(404).end("unknown method");
	}

	on(method, call) {
		this.handlers.set(method.toUpperCase(), call);
	}

	host(name, customkey, compress = false) {
		const file = fs.readFileSync(name, "utf8");
		const type = Server.types[path.extname(name).slice(1)];
		const fmt = compress ? file.replace(/[\n\t]/g, "") : file;
		this.map.set(customkey ?? name, { type, fmt });
	}

	listen(port, call) {
		this.server.listen(port, call);
	}

	static types = {
		css: "text/css",
		js: "text/javascript",
		html: "text/html",
	};
}

module.exports = new Server();
