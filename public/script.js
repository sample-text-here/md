console.log("hello, there!");
// this script isn't required for the site
// to function, but will make it nicer

const matches = {
	"[": "]",
	"(": ")",
	"{": "}",
	'"': '"',
	"'": "'",
};

const editor = document.getElementById("md");
editor.addEventListener("input", (e) => {
	if (!["insertLineBreak", "insertText"].includes(e.inputType)) return;
	const { value, selectionStart: sel } = editor;
	const insert = (str) =>
		(editor.value = `${value.slice(0, sel)}${str}${value.slice(sel)}`);

	if (")}]'\"".includes(e.data) && e.data === value[sel - 1]) {
		editor.value = `${value.slice(0, sel - 1)}${value.slice(sel)}`;
		editor.selectionStart = editor.selectionEnd = sel + 1;
		return;
	}

	if (e.data in matches) {
		insert(matches[e.data]);
		editor.selectionStart = editor.selectionEnd = sel;
		return;
	}

	if (e.inputType === "insertLineBreak") {
		const slice = value.slice(0, sel).trimEnd();
		const line = slice.slice(slice.lastIndexOf("\n") + 1);
		if (line[0] === "-") return insert("- ");
		if (line[0] === "*") return insert("* ");
		if (/^[0-9]+\.\s/.test(line)) {
			const num = Number(line.match(/^[0-9]+/)) + 1;
			return insert(num + ". ");
		}
	}
});
