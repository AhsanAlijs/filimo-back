const fs = require("fs");

function deleteFile(file) {
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

function deleteFiles(files) {
  files.forEach((file) => deleteFile(file));
}

module.exports = {
  deleteFile,
  deleteFiles,
};