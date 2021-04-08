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

function clean(str) {
	return str
		.replace(/\r\n/g, "\n")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function renderMarkdown(text) {
	return list(list(clean(text), "ul"), "ol")
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
		.replace(/```.*\n((.|\n)+?)```/gim, "<pre>$1</pre>")
		.replace(/`((\\.|[^`])+)`/gim, "<code>$1</code>")
		.replace(/!\[(.+?)\]\((.+?)\)/gim, '<img src="$2" alt="$1" />')
		.replace(/\[(.+?)\]\((.+?)\)/gim, '<a href="$1">$2</a>')
		.replace(/(?<=\n)\n/gim, "<br />");
}

module.exports = renderMarkdown;
