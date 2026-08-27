// ── Crash-safety nets — registered before ANYTHING else in the app,
//    since this is the true entry point. ──
process.on('uncaughtException', (err) => {
    console.error(`[Uncaught exception] ${err.message}`);
    console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.error(`[Unhandled rejection] ${reason?.message || reason}`);
});

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json({ limit: '6mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '6mb' }));
app.use('/media', express.static(require('path').join(__dirname, 'media')));

const pairRouter = require('./main');
app.use('/', pairRouter);

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

module.exports = app;
