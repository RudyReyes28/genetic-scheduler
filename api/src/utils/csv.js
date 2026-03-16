const { parse } = require('csv-parse/sync');

const parseCsvBuffer = (buffer) => {
  const content = buffer.toString('utf-8');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return records;
};

module.exports = {
  parseCsvBuffer,
};