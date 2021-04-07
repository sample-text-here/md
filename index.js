const http = require("http");
const fs = require("fs");
const path = require("path");
if (!fs.existsSync("files")) fs.mkdirSync("files");

function renderMarkdown(text) {
	const ul = /(([\-*]\s+.+\n?)+)/g;
	const ol = /(([0-9]\. .+\n?)+)/g;
	const bq = (b) =>
		`<blockquote>${b.replace(/^\s*()&gt;?\s*/g, "")}</blockquote>`;

	function list(str, kind) {
		return str.replace(
			kind === "ol" ? ol : ul,
			(i) => `<${kind}>${i.replace(/^[*-]\s+(.+)/gm, "<li>$1</li>")}</${kind}>`
		);
	}

	return list(list(text.replace(/\r\n/g, "\n"), "ul"), "ol")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/###### (.+)/gim, "<h6>$1</h6>")
		.replace(/##### (.+)/gim, "<h5>$1</h5>")
		.replace(/#### (.+)/gim, "<h4>$1</h4>")
		.replace(/### (.+)/gim, "<h3>$1</h3>")
		.replace(/## (.+)/gim, "<h2>$1</h2>")
		.replace(/# (.+)/gim, "<h1>$1</h1>")
		.replace(/&gt; (.+\n?)+/gm, bq)
		.replace(/~~(.+?)~~/gim, "<s>$1</s>")
		.replace(/\*\*(.+?\*?)\*\*/gim, "<b>$1</b>")
		.replace(/\*(.+?)\*/gim, "<i>$1</i>")
		.replace(/^\s*---+\s*$/gim, "<hr />")
		.replace(/`((\\.|[^`])+)`/gim, "<code>$1</code>")
		.replace(/```.*\n((.|\n)+?)```/gim, "<pre>$1</pre>")
		.replace(/!\[(.+?)\]\((.+?)\)/gim, '<img src="$2" alt="$1" />')
		.replace(/\[(.+?)\]\((.+?)\)/gim, '<a href="$1">$2</a>')
		.replace(/(?<=\n)\n/gim, "<br />");
}

class Files {
	create(file) {
		const id = Math.random().toString(32).slice(2, 10);
		const name = path.join("files", id);
		if (fs.existsSync(name)) return this.create(file);
		fs.writeFileSync(name, file);
		return id;
	}

	grab(id) {
		const file = path.join("files", id);
		if (!fs.existsSync(file)) return null;
		return fs.createReadStream(file);
	}
}

class Server {
	constructor() {
		this.map = new Map();
		this.server = http.createServer(this.handle.bind(this));
		this.files = new Files();
	}

	handle(req, res) {
		if (req.method.toUpperCase() === "POST") return this.upload(req, res);
		const file = path.basename(req.url);
		if (this.map.has(file)) {
			const type = Server.types[path.extname(file).slice(1)];
			res.writeHead(200, { "Content-Type": type || "text/html" });
			return res.end(this.map.get(file));
		}
		this.render(file, res);
	}

	upload(req, res) {
		let data = "";
		req.on("data", (chunk) => (data += chunk.toString()));
		req.on("end", () => {
			const content = new URLSearchParams(data).get("content");
			if (!content) return res.end(400, "empty content");
			const id = this.files.create(renderMarkdown(content));
			res.writeHead(301, { Location: "/" + id });
			res.write("success! id: " + id);
			res.end();
		});
	}

	render(id, res) {
		const stream = this.files.grab(id);
		if (!stream) {
			res.writeHead(404);
			return res.end("can't find that");
		}
		const html = this.map.get("base");
		res.writeHead(200, { "Content-Type": "text/html" });
		res.write(html[0]);
		stream.pipe(res, { end: false });
		stream.on("end", () => res.end(html[1]));
	}

	host(name, compress = false, customkey) {
		const file = fs.readFileSync(name, "utf8");
		this.map.set(
			customkey ?? name,
			compress ? file.replace(/[\n\t]/g, "") : file
		);
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

const server = new Server();
server.host("public/index.html", false, "");
server.host("public/style.css", true, "style.css");
server.host("public/input.css", true, "input.css");
server.host("public/script.js", false, "script.js");
server.map.set("base", fs.readFileSync("public/main.html", "utf8").split("$"));
server.listen(process.env.PORT || 3000, () => console.log("ready"));
