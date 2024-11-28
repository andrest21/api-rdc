const bcrypt = require('bcrypt');

async function generate(password){
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    console.log(isPasswordValid);
}
async function validatePass(password){
    const isPasswordValid = await bcrypt.compare(password, "$2a$10$aSVQLhPdwPB03MC2sQuCAuKBhcZe./qbA7VOwQ0hbVMEC2VhXS8R.");
    console.log(isPasswordValid);
}

// generate('VesselProd2024#');
validatePass('123456');

