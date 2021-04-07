const fs = require("fs");
const path = require("path");
if (!fs.existsSync("files")) fs.mkdirSync("files");

class Files {
	create(file, force = false) {
		const id = Math.random().toString(32).slice(2, 10);
		const name = path.join("files", id);
		if (fs.existsSync(name) && !force) return this.create(file);
		fs.writeFileSync(name, file);
		return id;
	}

	grab(id) {
		const file = path.join("files", id);
		if (!fs.existsSync(file)) return null;
		return fs.createReadStream(file);
	}

	delete(id) {
		const file = path.join("files", id);
		if (!fs.existsSync(file)) return null;
		return fs.unlinkSync(file);
	}
}

module.exports = new Files();
