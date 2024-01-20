const {createApp} = Vue;
const app = createApp({
    data(){ return {
        verified:false,
        verified2:false,
        search_filter:false,
        search_by_time:false,
        search_by_text:false,
        search_user_filter:false,
        balance_page:false,
        whoami_page:false,
        budget_page:true,
        selected_balance:false,
        specific_balance:"",
        month_search:0,
        year_search:0,
        text_search:"",
        user_search:"",
        show_users:[],
        users_to_search:[],
        budgets:[],
        show_balance:[],
        budget_to_modify:[],
        budget_to_search:[],
        whoami:"",
        id:0,
        username:"",
        day:0,
        month:0,
        year:0,
        description:"",
        category:"",
        total_cost:0,
        users:"",
        shares:"",
    }},

    methods:{

        insertData: async function (){
            const response = await fetch("/api/auth/insert");
            await response.json();
            console.log("caricamento dati test per demo effettuato");
            alert("caricamento dati test per demo effettuato");
        },
        getBudgets: async function (){
            const response = await fetch("/api/app/budget");
            this.budgets = await response.json();
        },
        getUsers: async function (){
            const response = await fetch("/api/app/users");
            this.show_users = await response.json();
        },
        getBalance: async function (){
            const response = await fetch("/api/app/balance");
            this.show_balance = await response.json();
        },
        getSelectedBalance: async function (id){
            const response = await fetch(`/api/app/balance/${id}`);
            this.specific_balance= await response.json();
        },
        getBudgetModify: async function (year,month,id){
            const response = await fetch(`/api/app/budget/${year}/${month}/${id}`);
            this.budget_to_modify= await response.json();
        },
        getWhoamI:async function (){
            const response = await fetch("/api/app/whoami");
            this.whoami= await response.json();
        },
        searchBudget_bytime: async function (year_,month_){
            const year=parseInt(year_);
            const month=parseInt(month_);
            console.log("anno:", year);
            console.log("mese:", month);
            if (year!==0 && month!==0){
                const response = await fetch(`/api/app/budget/${year}/${month}`);
                this.budget_to_search = await response.json();
            };
            if (year!==0 && month===0){
                const response = await fetch(`/api/app/budget/${year}`);
                this.budget_to_search = await response.json();
            };;
        },

        searchBudget_bytext: async function (text_search){
            console.log(text_search);
            
            if (text_search!==""){
                console.log("testo:", text_search);
                const url = `/api/app/budget/search/filter/text/text_search/?q=`+(text_search);
                const response = await fetch(url);
                this.budget_to_search = await response.json();
            };
        },
        searchUser_bytext: async function (user_search){
            console.log(user_search);        
            if (user_search!==""){
                console.log("testo:", user_search);
                const url = `/api/app/user/search/?q=`+(user_search);
                const response = await fetch(url);
                this.users_to_search = await response.json();
            };
        },

        addBudget: async function (){
            const budget={
                id:this.id,
                day:this.day,
                month:this.month,
                year:this.year,
                description:this.description,
                category:this.category,
                total_cost:this.total_cost,
                users:this.users,
                shares:this.shares
            };
            const response = await fetch("/api/app/budget", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(budget) 
            });
            const res = await response.json();
            if (response.status===409){
                alert("Insert an unique ID");
            } else {
                this.budgets.push(res);
            }
            
          },

        removeBudget: async function (year,month,id) {
            console.log({ id });
        
            const apiUrl = `/api/app/budget/${year}/${month}/${id}`
            if (confirm("Do you really want to delete?")){
                try {
                    const response = await fetch(apiUrl, {
                        method: 'DELETE',
                        headers: {
                                        'Content-Type': 'application/json'
                                    }
                    });
            
                    console.log(response);
                    const index = this.budgets.indexOf(response);
                    this.budgets.splice(index, 1);

                    
            
                } catch (error) {
                    console.error('Errore durante la chiamata DELETE:', error);
                }
            }
        },
        modifyBudget: async function (id,day,month,year,description,category,total_cost,users,shares,id_old){
            const budget={
                id: id,
                day:day,
                month:month,
                year:year,
                description:description,
                category:category,
                total_cost:total_cost,
                users:users,
                shares:shares
            };
            console.log("vecchio id:",id_old);
            console.log("nuovo id:",id);
            console.log(budget);
            const response = await fetch(`/api/app/budget/${id_old}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(budget) 
            });
            const res = await response.json();
            if (response.status===409){
                alert("Insert an unique ID");
            } else {
                location.reload(); // Reloads the current page
                //this.budgets.push(res);
            }
            
        },
    },
    mounted: function(){
        this.getUsers();
        this.getBudgets();;
        this.getBalance();
        this.getWhoamI();
    }

}).mount("#app");