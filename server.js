const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ข้อมูลระดับพลังและมิติ
const RANKS = ["รวบรวมลมปราณ", "ก่อตั้งรากฐาน", "หลอมรวมแก่นทอง", "วิญญาณก่อกำเนิด", "ตัดพ้นปุถุชน", "จุติเทพ", "มหาเทพนิรันดร์", "ราชันย์เทวะ", "ปฐมกาลไร้ขอบเขต"];
const REALMS = [
    { name: "Aetheria", bg: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200" },
    { name: "Void Abyss", bg: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200" },
    { name: "Neon Chronos", bg: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200" }
];

let players = {};

setInterval(() => {
    Object.keys(players).forEach(id => {
        let p = players[id];
        if (p.isAuto) {
            p.exp += (15 / (p.level + 1));
            p.gold += (p.level * 600); // รายได้สมดุล
            p.monsterKilled = (p.monsterKilled || 0) + 1;

            if (p.exp >= 100) { p.level++; p.exp = 0; }
            
            // ตรวจสอบการปรากฏของบอส (ทุกๆ เลเวลที่ลงท้ายด้วย 9 และฆ่ามอนครบ 50)
            p.bossReady = (p.level % 10 === 9 && p.monsterKilled % 50 === 0);
            
            let rIdx = Math.min(Math.floor((p.level - 1) / 10), RANKS.length - 1);
            p.rankName = RANKS[rIdx];
            p.realm = REALMS[p.level % 3].name;
            p.bg = REALMS[p.level % 3].bg;
            
            io.to(id).emit("tick", p);
        }
    });
}, 1000);

io.on("connection", (socket) => {
    socket.on("join", (save) => {
        players[socket.id] = save || { level: 1, exp: 0, gold: 10000, monsterKilled: 0, isAuto: false, rankName: RANKS[0], realm: REALMS[0].name, bg: REALMS[0].bg };
    });

    socket.on("toggle", () => { if(players[socket.id]) players[socket.id].isAuto = !players[socket.id].isAuto; });

    // คำสั่ง GM ลับ (รับเฉพาะจาก Client ที่รู้วิธีกด)
    socket.on("gm_power", (type) => {
        let p = players[socket.id];
        if(!p) return;
        if(type === "gold") p.gold += 1000000;
        if(type === "lv") p.level += 10;
        io.to(socket.id).emit("tick", p);
    });

    socket.on("disconnect", () => delete players[socket.id]);
});

server.listen(process.env.PORT || 3000);
