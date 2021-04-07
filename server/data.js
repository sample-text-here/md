const fs = require("fs");
const blockSize = 4 + 8 + 3 + 16 + 16 + 64;

const defaults = {
	author: "anon",
	title: "untitled",
	hash: Buffer.alloc(16),
};

function prep(str) {
	const buf = Buffer.from(str);
	buf.length = Math.min(buf.length, 255);
	return buf;
}

class Data {
	constructor(file) {
		if (!fs.existsSync(file)) fs.writeFileSync(file, "");
		this.index = fs.openSync(file, "r+");
		this.cache = new Map();
	}

	find(id) {
		let index = 0;
		while (true) {
			const got = Buffer.alloc(blockSize);
			if (fs.readSync(this.index, got, 0, 4, index) === 0) break;
			if (got.readUInt32BE() === id) return index;
			index += blockSize;
		}
		return -1;
	}

	write(id, data) {
		data = { ...defaults, ...data };
		
		const buf = Buffer.alloc(blockSize);
		const [author, title] = [prep(data.author), prep(data.title)];
		
		buf.writeUInt32BE(id, 0);
		buf.writeBigInt64BE(BigInt(Date.now()), 4);

		buf.writeUInt8(author.length, 12);
		buf.writeUInt8(title.length, 13);
		author.copy(buf, 14);
		data.hash.copy(buf, 30);
		title.copy(buf, 46);

		const index = this.find(id);
		if (index === -1) {
			fs.writeSync(this.index, buf);
		} else {
			fs.writeSync(this.index, buf, 0, blockSize, index);
		}
	}

	read(id) {
		if (this.cache.has(id)) return this.cache.get(id);
		const index = this.find(id);
		if (index === -1) return null;
		
		const buf = Buffer.alloc(blockSize);
		const data = {};
		fs.readSync(this.index, buf, 0, blockSize, index);
		data.id = buf.readUInt32BE(0);
		data.date = new Date(Number(buf.readBigInt64BE(4)));
		
		const alen = buf.readUInt8(12);
		const tlen = buf.readUInt8(13);
		data.author = buf.slice(14, 14 + alen).toString("utf8");
		data.hash = buf.slice(30, 30 + hlen);
		data.title = buf.slice(46, 46 + tlen).toString("utf8");
		
		this.cache.set(id, data);
		return data;
	}

	delete(id) {
		const index = this.find(id);
		if (index === -1) return null;
		
		const zero = Buffer.alloc(4).fill(0);
		fs.writeSync(this.index, zero, 0, 4, index);
	}
}

module.exports = new Data("data.db");
