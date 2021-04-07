const fs = require("fs");
const path = require("path");
const renderMarkdown = require("./server/markdown.js");
const files = require("./server/files.js");
const server = require("./server/main.js");
const base = fs.readFileSync("public/main.html", "utf8").split("$");

function compose(req, res) {
	const id = path.parse(req.url).name;
	const file = files.grab(id);
	if (!file) return res.writeHead(404).end("can't find that");
	res.writeHead(200, { "Content-Type": "text/html" });
	res.write(base[0]);
	res.write("hello");
	res.write(base[1]);
	file.pipe(res, { end: false });
	file.on("end", () => res.end(base[2]));
}

function upload(req, res) {
	let body = "";
	req.on("data", (c) => (body += c.toString()));
	req.on("end", () => {
		const cont = new URLSearchParams(body).get("content");
		if (!cont) return res.writeHead(400).end("empty content");
		const id = files.create(renderMarkdown(cont));
		res.writeHead(301, { Location: "/" + id }).end(`success!\nid: ${id}`);
	});
}

server.host("public/index.html", "");
server.host("public/style.css", "style.css", true);
server.host("public/input.css", "input.css", true);
server.host("public/script.js", "script.js");
server.on("GET", compose);
server.on("POST", upload);

server.listen(process.env.PORT || 3000, () => console.log("ready"));
