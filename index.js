const express = require("express");
const ejs = require("ejs");
const session = require("express-session");
const PORT = 3000;
const app = express();
const mongoose = require("mongoose");
const user = require("./models/users");
const accounts=require("./models/accounts");


const admin = {
  name: "admin",
  password: "123",
};

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

let userLoggedin = false;
let adminLoggedin = false;
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

app.get("/", async(req, res) => {
  if ( req.session.user) {
    const userId = req.session.user._id;
    const accountData = await accounts.find({ userId: userId });
    res.render("home", {accountData: accountData, message: req.session.user.name });

   
  } else if (req.session.admin){
    const message = req.session.admin.email;
    const users = await user.find({});
    res.render("adminPage", { message, users });
      
  } else res.render("login", { error:null });
});

app.get("/home", async (req, res) => {
  if (req.session.user) {
    try {
      const userId = req.session.user._id;
      const accountData = await accounts.find({ userId: userId });
      res.render("home", { accountData: accountData, message: req.session.user.name });
    } catch (err) {
      console.error(err);
     
    }
  } else if (req.session.admin) {
    res.redirect("/adminPage");
  } else {
    res.render("login", { error: null });
  }
});


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name=req.body.name
  try {
    const existingUser = await user.findOne({ email: email });

    if (existingUser) {
      res.render("login", { error: "User already exists" });
    } else {
      const newUser = new user({
        name:name,
        email: email,
        password: password,
      });

      await newUser.save();
      
      res.render("login", { error: "New user created" });
    }
  } catch (err) {
    console.error(err);
   
  }
});

app.get("/adminPage", async (req, res) => {
  if (adminLoggedin) {
    try {
      const message = req.session.admin.email;
      const users = await user.find({});
      const account=accounts
      res.render("adminPage", { message, users,account });
    } catch (err) {
      console.error(err);
     
    }
  } else {
    res.render("login", { error: "" });
  }
});


app.post("/home", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
 



  try {
    const foundResult = await user.findOne({ email: email });

    if (foundResult && foundResult.password === password) {
      userLoggedin = true;
      
      req.session.user = {
        _id: foundResult._id,
        name:  foundResult.name,
        email: email,
      };
      const accountData = await accounts.find({userId:req.session.user._id});
     
      res.render("home", { accountData: accountData, message: req.session.user.name,isAdmin: false,error:"" });
    } else if (email === admin.name && password === admin.password) {
      adminLoggedin = true;
      req.session.admin = {
        
        email: email,
      };

      res.redirect("/adminPage");
    } else {
      res.render("login", { error: "Invalid username or password" });
    }
  } catch (err) {
    console.error(err);
    
  }
});




app.post("/admin/removeUser", async (req, res) => {
  const userId = req.body.userId;
  
  try {
    await user.findByIdAndRemove(userId);
    res.redirect("/adminPage");
  } catch (err) {
    console.error(err);
   
  }
});



app.get("/admin/edit/:id", async (req, res) => {
  if (adminLoggedin) {
    try {
      const userId = req.params.id;
      const foundUser = await user.findById(userId);
      res.render("editUser", { user: foundUser });
    } catch (err) {
      console.error(err);
      
    }
  } else {
    res.redirect("/");
  }
});


app.post("/admin/updateUser/:id", async (req, res) => {
  const userId = req.params.id;
  const { email, password } = req.body;
      
  try {
    await user.findByIdAndUpdate(userId, { email, password });
    
    res.redirect("/adminPage");
  } catch (err) {
    console.error(err);
    
  }
});

app.get("/logout", (req, res) => {
  userLoggedin = false;
  adminLoggedin = false;
  req.session.destroy();
  res.render("login", { error: "Logout successfully" });
});



app.post("/addinfo", async (req, res) => {
  const website = req.body.website;
  const email = req.body.email;
  const password = req.body.password;
  
  
  try {
    const newAccount = new accounts({
      website: website,
      email: email,
      password: password,
      userId:req.session.user._id,
    });
    
    await newAccount.save();
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    
  }
});




app.get('/user/update/:id', async (req, res) => {
  const id = req.params.id

  try {
    const account = await accounts.findById(id);

    if (!account) {

      return res.redirect('/home');
    }

   res.render('update', { account });
  } catch (error) {
    console.error(error);
    res.redirect('/home');
  }
});


app.post('/user/update/data/:id', async (req, res,next) => {
  const id = req.params.id

  const { website, email, password } = req.body;
  

  try{
    await accounts.findByIdAndUpdate(id,{website, email, password})
    res.redirect("/home")
  }catch(err){
    console.log(err)

  }

})


app.get("/user/delete/:id", async (req, res) => {
  const userId = req.params.id
  try {
    await accounts.findByIdAndRemove(userId);
    res.redirect("/home");
  } catch (err) {
    console.error(err);
   
  }
});

app.get("/admin/view/:id", async (req, res) => {
 
    const id = req.params.id;
   
    try{
      const name=await user.findById(id)
      const data = await accounts.find({ userId: id })
       res.render("accountView",{account:data,user:name})
    }catch(err){
      console.log(err)
    }

})



app.get("/admin/view/delete/:id", async (req, res) => {
  try {
    const accountId = req.params.id;
    const deletedAccount = await accounts.findByIdAndRemove(accountId);
    const userId = deletedAccount.userId;
    const data = await accounts.find({ userId: userId });
    const users = await user.findById(userId); 
    res.render("accountView", { account: data, user: users }); 
  } catch (err) {
    console.error(err);
    
  }
});



app.listen(PORT, () => console.log("Server connected at http://localhost:3000"));
