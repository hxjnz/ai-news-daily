/**
 * Add a multi-day (date range) entry to the 每日计划 Notion database.
 * Usage:
 *   node add-daily-range.js "Task title" "YYYY-MM-DD" "YYYY-MM-DD"
 *   node add-daily-range.js   (reads from /tmp/notion-daily-range.json)
 *
 * JSON format for /tmp/notion-daily-range.json:
 *   { "title": "Task name", "start": "2026-02-16", "end": "2026-02-20" }
 */

require('dotenv').config();

const API_TOKEN = process.env.NOTION_API_TOKEN;
const DAILY_DB_ID = process.env.NOTION_DAILY_DB_ID;
const NOTION_VERSION = '2022-06-28';

if (!API_TOKEN || !DAILY_DB_ID) {
    console.error('❌ NOTION_API_TOKEN or NOTION_DAILY_DB_ID missing in .env');
    process.exit(1);
}

const fs = require('fs');

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
};

async function notionPost(endpoint, body) {
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

function getArgs() {
    const fromCli = process.argv[2] && process.argv[3] && process.argv[4];
    if (fromCli) {
        return {
            title: process.argv[2],
            start: process.argv[3],
            end: process.argv[4],
        };
    }
    const jsonPath = '/tmp/notion-daily-range.json';
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.title && data.start && data.end) return data;
    }
    return null;
}

async function main() {
    const args = getArgs();
    if (!args) {
        console.error('Usage: node add-daily-range.js "Task title" "YYYY-MM-DD" "YYYY-MM-DD"');
        console.error('   Or: put { "title", "start", "end" } in /tmp/notion-daily-range.json and run without args.');
        process.exit(1);
    }

    const { title, start, end } = args;
    console.log(`Adding to 每日计划: "${title}" from ${start} to ${end}`);

    const page = await notionPost('pages', {
        parent: { type: 'database_id', database_id: DAILY_DB_ID },
        icon: { type: 'emoji', emoji: '📌' },
        properties: {
            Name: { title: [{ text: { content: title } }] },
            Date: { date: { start, end } },
            Status: { select: { name: '进行中' } },
        },
    });

    console.log('✅ Created.');
    console.log(`🔗 https://notion.so/${page.id.replace(/-/g, '')}`);
}

main().catch((e) => {
    console.error('❌', e.message);
    process.exit(1);
});
