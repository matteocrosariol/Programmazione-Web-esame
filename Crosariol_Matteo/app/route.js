const express = require('express');
const jwt = require('jsonwebtoken');
//const ObjectID = require('mongodb').ObjectId;
const router = express.Router();
const db = require("./db.js");      //recupero modulo relativo al db

const verifyToken = (req,res,next) => {
    const token = req.cookies["token"];
    if (!token){
        res.status(403).json({"msg": "Autenticazione fallita"});
        return;
    }

    try{
        const decoded = jwt.verify(token, "basura");
        //req.userId = decoded.id;
        req.userName = decoded.username
        next();
    } catch (error){
        res.status(401).json({"msg": "Non autorizzato"});
    }
};

router.get("/users", verifyToken, async (req, res) => {
    const id_user= req.userId;
    const userName= req.userName;
    try{
        const mongo = await db.connectToDatabase();
        //let users = await mongo.collection("users").find().toArray();
        const users = await mongo.collection("users").find();
        const user = await mongo.collection("users").findOne({username: userName});
        const output = [];
        for await (const usr of users){
            const {username,name,surname}=usr;
            output.push({username,name,surname});
        }
        res.json(output);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

router.get("/budget", verifyToken, async (req, res) => {
    const userName= req.userName;
    try{
        const mongo = await db.connectToDatabase();
        const budget = await mongo.collection("budget").find({username: userName});
        const output = [];
        for await (const bgt of budget){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
        res.json(output);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

router.post("/budget", verifyToken, async (req, res) => {
    const userName= req.userName;
    let new_budget = {
        id: req.body.id,
        username: userName,
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
        description: req.body.description,
        category: req.body.category,
        total_cost: req.body.total_cost,
        users: req.body.users,
        shares: req.body.shares,
    };
    const id_verify = req.body.id;
    console.log(id_verify);
    const mongo = await db.connectToDatabase();
    try{
        const budget = await mongo.collection("budget").findOne({id: id_verify});
        console.log(budget);
        if (budget){
            res.status(409).json({'msg': "ID già esistente"});
            // alert("Duplicated ID, insert an unique ID");
        } else {
            await mongo.collection("budget").insertOne(new_budget);
            try{
                await update_add_Balance(new_budget,userName).then(console.log("aggiornamento balance effettuato"));
            } catch (error) {
                console.error('Error during update balance:', error);
    
            }
            res.json(new_budget);
        }
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});



async function update_add_Balance(new_budget, userName){
    console.log("utenti :", new_budget.users);
    const users_input=new_budget.users;
    const shares_input=new_budget.shares;
    const users_names = users_input.split(/,\s*/);
    const shares_quotes = shares_input.split(/,\s*/);

    if (users_names.length === shares_quotes.length){
        for (var i = 0; i < users_names.length; i++) {
            var current_name = users_names[i];
            var current_share= parseFloat(shares_quotes[i]);
    
            //check if the user is in the database user
            const mongo = await db.connectToDatabase();
            const user = await mongo.collection("users").findOne({username: current_name});  
            if (user){
                console.log(current_name,"condizione trovato: true");
                
                const users_balance = await mongo.collection("balance").findOne({user1:userName,user2:current_name});
                console.log("user_balance",users_balance);
                if (users_balance){
                    //record exist, need to be updated
                    console.log("balance trovato, ora lo modifico");
                    const old_give= parseFloat(users_balance.give);
                    const old_take= parseFloat(users_balance.take);
                    if (parseFloat(new_budget.total_cost)==0){
                        const new_give=parseFloat(current_share);
                        const give=old_give+new_give;
                        const take= old_take;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").replaceOne({user1:userName,user2:current_name},newBalance);
                        console.log("balance modificato:",newBalance);
                    } else{
                        const new_take=parseFloat(current_share);
                        const take=old_take+new_take;
                        const give=old_give;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").replaceOne({user1:userName,user2:current_name},newBalance);
                        console.log("balance modificato:",newBalance);
                    };
                } else {
                    //record not exist, need to be created
                    console.log("balance non trovato, ora lo creo");
                    if (parseFloat(new_budget.total_cost)==0){
                        const give=parseFloat(current_share);
                        const take=0;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").insertOne(newBalance);
                        console.log("nuovo balance:",newBalance);
                    } else {
                        const take=parseFloat(current_share);
                        const give=0;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").insertOne(newBalance);
                        console.log("nuovo balance:",newBalance);
                    };
                    console.log("balance updated");
                }
            
            
            } else {
                console.log(current_name,"condizione trovato: false");
                res.json({'msg': "Utente non trovato"});
            };

    }
    } else {
        res.status(409).json({'msg': "numbers of users and shares is not the same"}); 
    }
};



router.put("/budget/:id", verifyToken, async (req, res) => {
    const userName= req.userName;
    const old_id=parseInt(req.params.id);
    const new_budget = {
        id: req.body.id,
        username: userName,
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
        description: req.body.description,
        category: req.body.category,
        total_cost: req.body.total_cost,
        users: req.body.users,
        shares: req.body.shares,
    };
    const id_verify = req.body.id;          //check if the new id inserted already exist
    console.log(id_verify);
    const mongo = await db.connectToDatabase();
    try{
        const budget = await mongo.collection("budget").find({id: id_verify});
        const output = [];
        for await (const bgt of budget){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
    
        if ((output.length>=1) && (id_verify!==old_id)){
            res.status(409).json({'msg': "ID già esistente"});
        } else {
            const result = await mongo.collection("budget").findOne({id: old_id});
            await mongo.collection("budget").replaceOne({id: old_id},new_budget);
            console.log(old_id,new_budget);
    
            try{
                await update_delete_Balance(result,userName).then(console.log("aggiornamento balance effettuato"));
                await update_add_Balance(new_budget,userName).then(console.log("aggiornamento balance effettuato"));
            } catch (error) {
                console.error('Error during update balance:', error);
    
            }
    
            res.json(new_budget);
        }
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});



router.delete("/budget/:year/:month/:id", verifyToken, async (req,res) => {
    const userName= req.userName;
    const id_inserted = parseInt(req.params.id);
    const month_inserted = parseInt(req.params.month);
    const year_inserted= parseInt(req.params.year);
    const mongo = await db.connectToDatabase();
    try{
        const result = await mongo.collection("budget").findOne({id: id_inserted, username: userName, year: year_inserted, month: month_inserted});
        const budget = await mongo.collection("budget").deleteOne({id: id_inserted, username: userName, year: year_inserted, month: month_inserted});
        console.log(id_inserted, month_inserted, year_inserted, userName);
        try{
            await update_delete_Balance(result,userName).then(console.log("aggiornamento balance effettuato"));
        } catch (error) {
            console.error('Error during update balance:', error);
    
        }
        res.json(result);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

async function update_delete_Balance(budget_delete, userName){
    console.log("utenti :", budget_delete.users);
    const users_input=budget_delete.users;
    const shares_input=budget_delete.shares;
    const users_names = users_input.split(/,\s*/);
    const shares_quotes = shares_input.split(/,\s*/);
    
        for (var i = 0; i < users_names.length; i++) {
            var current_name = users_names[i];
            var current_share= parseFloat(shares_quotes[i]);
    
            //check if the user is in the database user
            const mongo = await db.connectToDatabase(); 
                const users_balance = await mongo.collection("balance").findOne({user1:userName,user2:current_name});
                console.log("user_balance",users_balance);
                if (users_balance){
                    //record exist, need to be updated
                    console.log("balance trovato, ora lo modifico");
                    const old_give= parseFloat(users_balance.give);
                    const old_take= parseFloat(users_balance.take);
                    if (parseFloat(budget_delete.total_cost)==0){
                        const new_give=parseFloat(current_share);
                        const give=old_give-new_give;
                        const take= old_take;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").replaceOne({user1:userName,user2:current_name},newBalance);
                        console.log("balance modificato:",newBalance);
                    } else{
                        const new_take=parseFloat(current_share);
                        const take=old_take-new_take;
                        const give=old_give;
                        const total=take-give;
                        const newBalance = {user1:userName, user2:current_name, give, take, total};
                        await mongo.collection("balance").replaceOne({user1:userName,user2:current_name},newBalance);
                        console.log("balance modificato:",newBalance);
                    };
                } else {
                    res.status(409).json({'msg': "Error: appear that the balance record not exist"}); 
                }
    }
};

router.get("/budget/:year", verifyToken, async (req, res) => {
    try{
        const userName= req.userName;
        const year_inserted= parseInt(req.params.year);
        const mongo = await db.connectToDatabase();
        const budget = await mongo.collection("budget").find({username: userName, year: year_inserted});
        const output = [];
        for await (const bgt of budget){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
        res.json(output);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

// router.get("/budget/:month", verifyToken, async (req, res) => {
//     const userName= req.userName;
//     const month_inserted = parseInt(req.params.month);
//     const mongo = await db.connectToDatabase();
//     let budget = await mongo.collection("budget").find({username: userName,month: month_inserted});
//     const output = [];
//     for await (const bgt of budget){
//         const {id,username,day,month,year,description,total_cost,users,shares}=bgt;
//         output.push({id,username,day,month,year,description,total_cost,users,shares});
//     }
//     res.json(output);
// });

router.get("/budget/:year/:month", verifyToken, async (req, res) => {
    try{
        const userName= req.userName;
        const year_inserted= parseInt(req.params.year);
        const month_inserted = parseInt(req.params.month);
        const mongo = await db.connectToDatabase();
        const budget = await mongo.collection("budget").find({username: userName, year: year_inserted, month: month_inserted});
        const output = [];
        for await (const bgt of budget){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
        res.json(output);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

router.get("/budget/:year/:month/:id", verifyToken, async (req, res) => {
    const userName= req.userName;
    try{
        const id_inserted = parseInt(req.params.id);
        const month_inserted = parseInt(req.params.month);
        const year_inserted= parseInt(req.params.year);
        const mongo = await db.connectToDatabase();
        const budget = await mongo.collection("budget").find({id: id_inserted, username: userName, year: year_inserted, month: month_inserted});
        const output = [];
        for await (const bgt of budget){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

router.get("/budget/search/filter/text/text_search/", verifyToken, async (req, res) => {
    //console.log(req.params.text_search);
    const query=req.query.q;
    try {
        console.log("query:",query);
        const userName= req.userName;
        const mongo = await db.connectToDatabase();
        console.log("query:");
        
        const results = await mongo.collection("budget").find({
            $and: [
                {
                    $or: [
                        { description: { $regex: query, $options: 'i' } },
                        { users: { $regex: query, $options: 'i' } },
                        { category: { $regex: query, $options: 'i' } },
                    ]
                },
                { username: userName } 
            ]
        });

        const output = [];
        for await (const bgt of results){
            const {id,username,day,month,year,description,category,total_cost,users,shares}=bgt;
            output.push({id,username,day,month,year,description,category,total_cost,users,shares});
        }
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nella ricerca.' });
    }
});

router.get("/user/search/", verifyToken, async (req, res) => {
    console.log("porcodio ricerca utenti");
    const query=req.query.q;
    try {
        console.log("query:",query);
        const userName= req.userName;
        const mongo = await db.connectToDatabase();
        console.log("query:");
        
        const results = await mongo.collection("users").find({
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { name: { $regex: query, $options: 'i' } },
                        { surname: { $regex: query, $options: 'i' } },
                    ]
        });

        const output = [];
        for await (const usr of results){
            const {username,name,surname}=usr;
            output.push({username,name,surname});
        }
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nella ricerca.' });
    }
});


router.get("/balance", verifyToken, async (req, res) => {
    const userName= req.userName;
    const mongo = await db.connectToDatabase();
    try{
        const balance = await mongo.collection("balance").find({user1: userName});
        const output = [];
        for await (const blnc of balance){
            const {user1,user2,give,take,total}=blnc;
            output.push({user1,user2,give,take,total});
        }
        res.json(output);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});

router.get("/balance/:id", verifyToken, async (req, res) => {
    const userName= req.userName;
    const user_2 = req.params.id;
    const mongo = await db.connectToDatabase();
    try{
        const result = await mongo.collection("balance").findOne({user1: userName, user2:user_2});
        res.json(result);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});


router.get("/whoami", verifyToken, async (req, res) => {
    console.log("im in who am i");
    const userName= req.userName;
    try{
        const mongo = await db.connectToDatabase();
        const result = await mongo.collection("users").findOne({username: userName});
        res.json(result);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }

});






    
module.exports = router;