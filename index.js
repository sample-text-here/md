const server = require("./server/routes.js");
server.listen(process.env.PORT || 3000, () => console.log("ready"));
