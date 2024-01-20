const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("./db.js"); 
const router = express.Router();



router.post("/signup", async (req,res) => {
    try{
        const {username, password, name, surname} = req.body;
        const mongo = await db.connectToDatabase();
        const user = await mongo.collection("users").findOne({username});
        console.log(user);
        if (user){
            res.status(409).json({'msg': "Utente già esistente"});
        } else {
            const lastUser = await mongo
                .collection("users")
                .findOne({}, {sort : {id:-1}});
            let id = lastUser?.id !== undefined ? lastUser.id : -1;
            id ++;
            const newUser = {id, username, password, name, surname};
            await mongo.collection("users").insertOne(newUser);
            res.json({'msg': "Utente creato con successo"});
        }
    } catch (error){
        console.log(error);
        res.status(500).json({ 'msg': "Internal Error"});
    }
});


router.post("/signin", async (req, res) => {
    try{
        const {username,password} = req.body;
        console.log("prova3");
        console.log({username,password});
        const aa = req.body.username;
        console.log(aa);
        const mongo = await db.connectToDatabase();
        const user = await mongo.collection("users").findOne({username});   //recuperiamo il documento con lo user che abbiamo passato
        console.log(user);
        if (user && user.password === password && user.username === username){
            const data = { username: user.username };
            const token = jwt.sign(data, "basura", {
                expiresIn: 86400, //24h
            });
            res.cookie("token", token, {httpOnly: true});   //cookie visibile solo dal browser
            res.redirect("../../budget.html");
        } else {
            res.status(401).json({'msg' : "Username o password errati"})
        }
    } catch (error){
        req.status(500).json({'msg': "Internal Error"});
    }


});

router.get("/insert", async (req,res) =>{
    const new_user1 = {
        id: 1,
        username: "matteo",
        password: "prova",
        name: "matteo",
        surname: "crosariol",
    };
    const new_user2 = {
        id: 2,
        username: "cia",
        password: "dalla",
        name: "nicolas",
        surname: "cia",
    };
    const new_user3 = {
        id: 3,
        username: "ale",
        password: "dama",
        name: "alessandro",
        surname: "asdrubale",
    };
    const new_budget1 = {
        id: 1,
        username: "matteo",
        day: 20,
        month: 1,
        year: 2024,
        description: "netlix",
        category: "svago",
        total_cost: 60,
        users: "cia,ale",
        shares: "20,20",
    };
    const new_budget2 = {
        id: 2,
        username: "matteo",
        day: 21,
        month: 1,
        year: 2024,
        description: "rimborso netlix",
        category: "svago",
        total_cost: 0,
        users: "cia,ale",
        shares: "20,20",
    };
    const new_budget3 = {
        id: 3,
        username: "matteo",
        day: 21,
        month: 2,
        year: 2024,
        description: "quota compleanno ale",
        category: "svago",
        total_cost: 0,
        users: "cia",
        shares: "10",
    };
    const new_balance1 = {
        user1: "matteo",
        user2: "cia",
        give: 30,
        take: 20,
        total: -10,
    };
    const new_balance2 = {
        user1: "matteo",
        user2: "ale",
        give: 20,
        take: 20,
        total: 0,
    };
    try{
        const mongo = await db.connectToDatabase();
        await mongo.collection("users").insertOne(new_user1);
        await mongo.collection("users").insertOne(new_user2);
        await mongo.collection("users").insertOne(new_user3);
        await mongo.collection("budget").insertOne(new_budget1);
        await mongo.collection("budget").insertOne(new_budget2);
        await mongo.collection("budget").insertOne(new_budget3);
        await mongo.collection("balance").insertOne(new_balance1);
        await mongo.collection("balance").insertOne(new_balance2);
    } catch (error){
        req.status(500).json({'msg': "Internal Error"});
    }
    res.status(200).json({'msg' : "caricamento dati effettuato"})

});

    

module.exports = router;