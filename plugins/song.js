const { cmd } = require("../arslan");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
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
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play",
    category: "download",
    use: ".play <song name>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a song name or YouTube link\n\nExample: .play Pasoori");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        let videoUrl = query;
        let videoInfo;

        if (ytdl.validateURL(query)) {
            videoInfo = await ytdl.getBasicInfo(query);
        } else {
            const search = await yts(query);
            if (!search.videos || !search.videos.length) {
                return reply("❌ No results found");
            }
            videoUrl = search.videos[0].url;
            videoInfo = await ytdl.getBasicInfo(videoUrl);
        }

        const details = videoInfo.videoDetails;
        const durationSec = parseInt(details.lengthSeconds || "0", 10);

        if (durationSec > 480) { // 8 minutes safety cap — keeps memory usage safe on small dynos
            return reply("❌ Song is too long (max 8 minutes). Try a shorter one.");
        }

        const audioStream = ytdl.downloadFromInfo(videoInfo, { filter: "audioonly", quality: "highestaudio" });
        const buffer = await streamToBuffer(audioStream);

        await conn.sendMessage(from, {
            audio: buffer,
            mimetype: "audio/mpeg",
            ptt: false,
            fileName: `${details.title || "song"}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: (details.title || "YouTube Song").substring(0, 40),
                    body: "▶︎ •၊၊||၊|။||||။‌‌‌‌‌၊|• ★彡Naruto-MD-ʙᴇᴀᴛꜱ彡★",
                    thumbnailUrl: details.thumbnails?.[0]?.url,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("SONG ERROR:", err.message);
        reply("❌ Could not download this song — it may be restricted, age-gated, or unavailable. Try a different one.");
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
