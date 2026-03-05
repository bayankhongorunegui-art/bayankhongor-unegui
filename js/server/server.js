import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import { get, all, run } from "./db.js"

const app = express()

app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/*
Project бүтэц

repo root
 ├ index.html
 ├ details.html
 ├ css
 ├ js
 └ js/server/server.js
*/

const ROOT_DIR = path.resolve(__dirname, "../../")

// static files
app.use(express.static(ROOT_DIR))

// health check
app.get("/health",(req,res)=>{
res.json({ok:true})
})

/* ---------------- API ---------------- */

// бүх зар
app.get("/api/ads", async(req,res)=>{
try{
const rows = await all("SELECT * FROM ads ORDER BY id DESC")
res.json(rows)
}catch(e){
res.status(500).json({error:e.message})
}
})

// нэг зар
app.get("/api/ads/:id", async(req,res)=>{
try{
const row = await get("SELECT * FROM ads WHERE id=?",[
req.params.id
])

if(!row) return res.status(404).json({error:"Not found"})

res.json(row)

}catch(e){
res.status(500).json({error:e.message})
}
})

// зар нэмэх
app.post("/api/ads", async(req,res)=>{
try{

const {title,description,price,phone} = req.body

await run(
`INSERT INTO ads(title,description,price,phone)
VALUES(?,?,?,?)`,
[title,description,price,phone]
)

res.json({ok:true})

}catch(e){
res.status(500).json({error:e.message})
}
})

/* ---------------- ROOT ---------------- */

// нүүр хуудас
app.get("/",(req,res)=>{
res.sendFile(path.join(ROOT_DIR,"index.html"))
})

const PORT = process.env.PORT || 3001

app.listen(PORT,()=>{
console.log("Server running on port "+PORT)
})