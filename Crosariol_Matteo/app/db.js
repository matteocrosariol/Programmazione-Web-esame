const { MongoClient } = require('mongodb');
const MONGODB_URI = "mongodb://mongosrv";
const DB_NAME = "bilancio_familiare";
let cacheDb;    //variabile privata visibile solo nel modulo

module.exports = {
    connectToDatabase: async () => {
        if (cacheDb){
            console.log("Existing cached connection found!");
            return cacheDb;
        }
        console.log("Acquiring new DB connection....");
        try {
            const client = await MongoClient.connect(MONGODB_URI);
            const db = client.db(DB_NAME);
            cacheDb = db;
            return db;
        } catch (error){
            console.log("ERROR acquiring DB Connection!");
            console.log(error);
            throw error;
        }
    }
};

