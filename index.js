import express from "express"
import cors from "cors"
import bcrypt from "bcrypt"
import { PrismaClient, type } from '@prisma/client'
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser";

const prisma = new PrismaClient()
const app = express();
app.use(cors({credentials:true}));
app.use(express.json());
app.use(cookieParser());

app.post("/signup", async(req,res) => {
    const {username, password} = req.body;
    const existing_user = await prisma.users.findFirst({where: {username:username}});
    if(existing_user){
        res.status(302).json({message:"User already exists try with a different username"});
    }
    else{
        const hashedPassword = await bcrypt.hash(password,10);
        try {
            console.log("Entered", username, hashedPassword);
            const user = await prisma.users.create({
                data:{
                    username:username,
                    password:hashedPassword
                }
            });
            res.status(200).json({message:"User Creation is Successfull!"});
        } catch (error) {
            console.log("ERROR", error);
            res.status(500).json({error:error});
        }
    }
})

app.post("/signin", async(req,res) => {
    const {username, password} = req.body;
    const existing_user = await prisma.users.findFirst({where: {username:username}});
    if(existing_user){
        const passwordValidation = await bcrypt.compare(password, existing_user.password);
        if(passwordValidation){
            const token = jwt.sign({id:Number(existing_user.id)}, process.env.JWT_SECRET);
            console.log("TOKEN", token);
            res.cookie("token",token);
            res.status(200).json({message:"Logged in", token:token});
            // if(existing_user.role == "REGULAR"){
            //     res.status(200).json({message:"Logged in as regular", token:token});
            // }
            // if(existing_user.role == "ADMIN"){
            //     res.status(201).json({message:"Logged in as admin", token:token});
            // }
        }
        else{
            res.status(400).json({message:"Wrong Password"});
        }    
    }
    else{
        res.status(400).json({message:"Username doesn't exist"})
    }
})

//Anyone can create the Task No Authentication required
app.post("/task", async(req,res) => {
    const {title, description, type} = req.body;
    try {
        const task = await prisma.tasks.create({
            data:{
                title, description, type
            }
        });
        res.status(200).json({message:"Task Created!", id:task.id});
    } catch (error) {
        res.status(500).json({message:error});
    }
})

async function auth(req,res, next){
    const token = req.cookies.token; // Fetching the JWT Token
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        const user = await prisma.users.findFirst({where: {id:Number(req.user.id)}});
        if(user){
            next();
        }
        else{
            res.status(402).send({message:"User Not Found"});
        }
    }
    else {
        res.status(401).send({
            message: "Unauthorized"
        })
    }
}

app.post("/start-task", auth, async(req,res) => {
    const {task_id} = req.body;
    const user_id = req.user.id;
    try {
        const progress = await prisma.progress.create({
            data:{
                task_id:Number(task_id),
                user_id:user_id,
            }
        });
        res.status(200).json({message:"Task Started!", progress_id:progress.id});
    } catch (error) {   
        res.status(500).json({message:error});
    }
})

app.get("/progress", auth, async(req,res) => {
    const user_id = req.user.id;
    try {
        const user_progress = await prisma.progress.findMany({
            where:{user_id:user_id}
        }); // Fetching all the User Progress given the user_id
    } catch (error) {
        res.status(500).json({message:error});
    }
});

app.put("/complete-task", auth, async(req,res) => {
    const user_id = req.user.id;
    const {task_id} = req.body;
    try {
        const user_task_complete = await prisma.progress.update({
            where:{
                user_id_task_id:{
                    user_id:user_id, task_id:Number(task_id)
                },
            },
            data:{completed_at:new Date()}
        });
        res.status(200).json({message:"Task Completed", task_id:task_id, progress_id:user_task_complete.id});
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error});
    }
})



app.listen(3000, () => {console.log("Backend Started!")})
