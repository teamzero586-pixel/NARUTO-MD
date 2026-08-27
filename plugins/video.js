const yts = require('yt-search');
const ytdl = require('ytdl-core');
const { cmd } = require('../arslan');
const { fakevCard } = require('../lib/fakevCard');

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

cmd({
    pattern: "video",
    alias: ["vid", "playvideo"],
    desc: "Download YouTube Video",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text) {
            return reply("❌ Example:\n.video pasoori");
        }

        let videoUrl = text;
        let videoInfo;

        if (ytdl.validateURL(text)) {
            videoInfo = await ytdl.getBasicInfo(text);
        } else {
            const search = await yts(text);
            if (!search.videos.length) {
                return reply("❌ No video found");
            }
            videoUrl = search.videos[0].url;
            videoInfo = await ytdl.getBasicInfo(videoUrl);
        }

        const details = videoInfo.videoDetails;
        const durationSec = parseInt(details.lengthSeconds || "0", 10);

        if (durationSec > 300) { // 5 minutes safety cap — keeps memory usage safe on small dynos
            return reply("❌ Video is too long (max 5 minutes). Try a shorter one.");
        }

        const caption = `
╔ஜ۩▒█ Naruto-MD █▒۩ஜ╗
┃🎬 VIDEO FOUND
┃📌 Title: ${details.title}
┃⏱️ Duration: ${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}
┃⚡ Sending video...
╰━━━━━━━━━━━━━━⊷
`;

        await conn.sendMessage(from, {
            image: { url: details.thumbnails?.[0]?.url },
            caption
        }, { quoted: fakevCard });

        // format 18 = progressive 360p mp4 (video+audio together, small & reliable)
        const videoStream = ytdl.downloadFromInfo(videoInfo, { quality: '18' });
        const buffer = await streamToBuffer(videoStream);

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: "video/mp4",
            caption: `🎬 *${details.title}*\n\n> © Naruto-MD`
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("VIDEO ERROR:", err.message);
        reply("❌ Could not download this video — it may be restricted, age-gated, or unavailable. Try a different one.");
    }
});
