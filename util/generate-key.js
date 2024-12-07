// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("crypto");

crypto.generateKey('hmac', { length: 512 }, (err, key) => {
    if (err)
        throw err;

    console.log(key.export().toString('hex'));
});
