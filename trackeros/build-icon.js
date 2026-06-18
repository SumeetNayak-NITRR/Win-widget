const fs = require('fs');

async function run() {
  const pngToIco = (await import('png-to-ico')).default;
  const buf = await pngToIco('assets/real_icon.png');
  fs.writeFileSync('assets/icon.ico', buf);
  console.log('Successfully created assets/icon.ico');
}
run().catch(console.error);
