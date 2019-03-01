const fs = require("fs");
fs.writeFile("docs/.nojekyll", "", err => {
  if (err) {
    throw err;
  }
});
