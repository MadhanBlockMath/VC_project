// config.js
const dotenv = require('dotenv');
dotenv.config();
let config = {
    INDY_WEBSERVER_URL: "http://localhost:9000",
    ISSUER_AGENT_API_URL: "http://localhost:11000",
    HOLDER_AGENT_API_URL: "http://localhost:11001"
};
module.exports=config