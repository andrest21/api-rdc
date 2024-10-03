const bcrypt = require('bcrypt');

async function generate(password){
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
}
generate('1234');
