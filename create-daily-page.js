/**
 * Daily Page Creator - Creates a daily todo/notes page.
 *
 * Mode A (recommended): NOTION_TODAY_LIST_PAGE_ID set
 *   Creates a normal child page under "Today List" and inserts it at the top.
 *
 * Mode B: NOTION_DAILY_DB_ID set
 *   Inserts a page into the database (database sorted by Date descending).
 *
 * Uses Notion REST API directly (version 2022-06-28).
 */

require('dotenv').config();

const API_TOKEN = process.env.NOTION_API_TOKEN;
const TODAY_LIST_PAGE_ID = process.env.NOTION_TODAY_LIST_PAGE_ID;
const DAILY_DB_ID = process.env.NOTION_DAILY_DB_ID;
const NOTION_VERSION = '2022-06-28';
const NOTION_VERSION_NEW = '2025-09-03'; // for Create page with position (insert at top)

if (!TODAY_LIST_PAGE_ID && !DAILY_DB_ID) {
    console.error('❌ Set NOTION_TODAY_LIST_PAGE_ID (insert at top under Today List) or NOTION_DAILY_DB_ID (database) in .env');
    process.exit(1);
}

// Today's date formatting (NZ timezone)
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const dateStrCN = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;
const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekday = weekdayNames[today.getDay()];

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
};

async function notionPost(endpoint, body) {
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        method: 'POST', headers,
        body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

async function notionGet(endpoint) {
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, { method: 'GET', headers });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

// ---------------------------------------------------------------------------
// Page content builder
// ---------------------------------------------------------------------------

function buildDailyPageBlocks() {
    const blocks = [];

    // Date & greeting header
    blocks.push({
        object: "block", type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: `📅 ${dateStrCN}  ${weekday}` }, annotations: { bold: true } }],
            icon: { emoji: "🗓️" }, color: "blue_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // ---- Todo Section ----
    blocks.push({
        object: "block", type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "✅ Todo Tasks" } }] }
    });

    // High Priority
    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🔴 High Priority" } }] }
    });
    for (let i = 0; i < 3; i++) {
        blocks.push({
            object: "block", type: "to_do",
            to_do: { rich_text: [{ type: "text", text: { content: "" } }], checked: false }
        });
    }

    // Medium Priority
    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🟡 Medium Priority" } }] }
    });
    for (let i = 0; i < 3; i++) {
        blocks.push({
            object: "block", type: "to_do",
            to_do: { rich_text: [{ type: "text", text: { content: "" } }], checked: false }
        });
    }

    // Low Priority
    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🟢 Low Priority" } }] }
    });
    for (let i = 0; i < 3; i++) {
        blocks.push({
            object: "block", type: "to_do",
            to_do: { rich_text: [{ type: "text", text: { content: "" } }], checked: false }
        });
    }

    blocks.push({ object: "block", type: "divider", divider: {} });

    // ---- Notes Section ----
    blocks.push({
        object: "block", type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📝 Notes" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "💡 Ideas & Thoughts" } }] }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "📚 Learning & Reading" } }] }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🔗 Links & References" } }] }
    });
    blocks.push({
        object: "block", type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // ---- Daily Review Section ----
    blocks.push({
        object: "block", type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "🌙 Daily Review" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🎯 What went well today?" } }] }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "🔧 What could be improved?" } }] }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: "📌 Tomorrow's focus" } }] }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "" } }] }
    });

    return blocks;
}

async function notionPostBlocks(blockId, children) {
    const resp = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
        body: JSON.stringify({ children }),
    });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function createDailyPage() {
    console.log("🚀 Creating daily todo/notes page...");
    console.log(`📅 Date: ${dateStrCN} ${weekday}`);

    const title = `${dateStr} ${weekday}`;
    const blocks = buildDailyPageBlocks();

    try {
        if (TODAY_LIST_PAGE_ID) {
            console.log("📌 Mode: create new page under Today List (insert at top)");
            console.log(`   Parent page ID: ${TODAY_LIST_PAGE_ID}`);
            try {
                await notionGet(`pages/${TODAY_LIST_PAGE_ID}`);
            } catch (accessErr) {
                if (accessErr.message && (accessErr.message.includes('403') || accessErr.message.includes('Could not find'))) {
                    console.error("❌ 无法访问 Today List 页面。请在 Notion 中打开 Today List → 右上角 ••• → 连接 → 添加本 integration。");
                    process.exit(1);
                }
                throw accessErr;
            }
            const body = {
                parent: { type: 'page_id', page_id: TODAY_LIST_PAGE_ID },
                properties: { title: { title: [{ text: { content: title } }] } },
                icon: { type: 'emoji', emoji: '📋' },
                children: blocks.slice(0, 100),
                position: { type: 'page_start' },
            };
            let page;
            try {
                const res = await fetch('https://api.notion.com/v1/pages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_TOKEN}`,
                        'Notion-Version': NOTION_VERSION_NEW,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });
                page = await res.json();
                if (page.object === 'error') throw new Error(page.message);
            } catch (err) {
                if (err.message && (err.message.includes('position') || err.message.includes('page_start'))) {
                    delete body.position;
                    page = await notionPost('pages', body);
                } else throw err;
            }
            const pageId = page.id;
            for (let i = 100; i < blocks.length; i += 100) {
                await notionPostBlocks(pageId, blocks.slice(i, i + 100));
            }
            console.log("✅ Successfully created daily page under Today List!");
            console.log(`🔗 Notion URL: https://notion.so/${pageId.replace(/-/g, '')}`);
        } else {
            const page = await notionPost('pages', {
                parent: { type: "database_id", database_id: DAILY_DB_ID },
                icon: { type: "emoji", emoji: "📋" },
                properties: {
                    Name: { title: [{ text: { content: title } }] },
                    Date: { date: { start: dateStr } },
                    Status: { select: { name: '进行中' } },
                },
                children: blocks,
            });
            console.log("✅ Successfully created daily page!");
            console.log(`🔗 Notion URL: https://notion.so/${page.id.replace(/-/g, '')}`);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

createDailyPage();
