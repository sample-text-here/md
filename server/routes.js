const fs = require("fs");
const path = require("path");
const renderMarkdown = require("./markdown.js");
const files = require("./files.js");
const server = require("./main.js");
const data = require("./data.js");
const base = fs.readFileSync("public/main.html", "utf8").split("$");
const hash = (data) => crypto.createHash("sha256").update(data).digest();

function compose(id, stream) {
	const file = files.grab(id);
	if (!file) return res.writeHead(404).end("can't find that");
	const params = data.read(id);
	stream.writeHead(200, { "Content-Type": "text/html" })
	stream.write(base[0])
	stream.write(params?.title || "hello!")
	stream.write(base[1]);
	file.pipe(stream, { end: false })
	file.on("end", () => stream.end(base[2]));
}

function getbody(req, call) {
	const params = {};
	let body = "";
	req.on("data", (c) => (body += c.toString()));
	return new Promise((res) =>
		req.on("end", () => {
			for (let [key, value] of new URLSearchParams(body)) {
				params[key] = value;
			}
			res(params);
		})
	);
}

async function upload(req, res) {
	const body = await getbody(req);
	if (!body.content) return res.end(400, "empty content");
	const id = files.create(renderMarkdown(body.content));
	res.writeHead(301, { Location: "/" + id }).end(`success!\nid: ${id}`);
}

function getPage(req, res) {
	const id = path.parse(req.url).name;
	return compose(id, res);
}

server.host("public/index.html", "");
server.host("public/style.css", "style.css", true);
server.host("public/input.css", "input.css", true);
server.host("public/script.js", "script.js");
server.on("GET", getPage);
server.on("POST", upload);

module.exports = server;
