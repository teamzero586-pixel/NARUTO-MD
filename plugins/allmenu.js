const { cmd, commands } = require("../arslan");
const moment = require("moment-timezone");
const fs = require("fs");
const { fakevCard } = require('../lib/fakevCard');
const config = require("../config");

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help"],
    desc: "Fetch and display all available bot commands",
    category: "system",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    try {
        const brand = conn.brand || null;
        const botDisplayName = (brand && brand.botName) || config.BOT_NAME || 'Naruto Mini Bot';
        const channelJid = (brand && brand.channelJid) || config.CHANNEL_JID;

        let totalCommands = 0;
        let grouped = {};

        // Group commands by category
        for (const cmd of commands) {
            if (!cmd.pattern || !cmd.category) continue;

            totalCommands++;
            if (!grouped[cmd.category]) grouped[cmd.category] = [];
            grouped[cmd.category].push(cmd.pattern);
        }

        let menuText = "";
        for (const cat in grouped) {
            menuText += `\n🧚‍♀️ *${cat.toUpperCase()}*\n`;
            menuText += grouped[cat].map(c => `💫 ${c}`).join("\n") + "\n";
        }

        const time = moment().tz("Africa/Kampala").format("HH:mm:ss");
        const date = moment().tz("Africa/Kampala").format("dddd, MMMM Do YYYY");

        const caption = `
╭━━━《 *${botDisplayName}* 》━━━┈⊷
┃ ✦╭─────────────┈⊷
┃ ✦│▸ Total Commands : *${totalCommands}*
┃ ✦│▸ Time           : ${time}
┃ ✦│▸ Date           : ${date}
┃ ✦│▸ Platform       : Mr.Arslan
┃ ✦╰─────────────┈⊷
╰━━━━━━━━━━━━┈⊷
${menuText}
`.trim();

        const imgTarget = (brand && brand.botImage) || config.IMAGE_PATH;
        let menuImageSource;
        if (typeof imgTarget === 'string' && imgTarget.startsWith('data:')) {
            menuImageSource = Buffer.from(imgTarget.split(',')[1] || '', 'base64');
        } else if (typeof imgTarget === 'string' && fs.existsSync(imgTarget)) {
            menuImageSource = fs.readFileSync(imgTarget);
        } else {
            menuImageSource = { url: imgTarget || "https://files.catbox.moe/prkkzj.png" };
        }

        const menuPayload = {
            image: menuImageSource,
            caption,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        };
        await conn.sendMessage(m.chat, menuPayload, { quoted: fakevCard });

    } catch (err) {
        console.error("AllMenu Error:", err.message);
        reply("❌ Error while generating menu.");
    }
});
