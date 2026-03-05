/**
 * AI Daily News - Notion Publisher
 *
 * Mode A: NOTION_DAILY_NEWS_PAGE_ID set (recommended)
 *   Creates a new child page under "AI 每日新闻" and inserts it at the top.
 *   No database; the page appears as the first subpage under that parent.
 *
 * Mode B: NOTION_PUBLIC_PAGE_ID set
 *   Updates that single page in place every day. You enable "Publish to web"
 *   on that page once → stable public URL, no GitHub needed.
 *
 * Mode C: NOTION_NEWS_DB_ID set
 *   Inserts a new page into the database each day (database sorted by Date).
 *
 * Uses Notion REST API (version 2022-06-28).
 */

require('dotenv').config();
const path = require('path');

const API_TOKEN = process.env.NOTION_API_TOKEN;
const NEWS_DB_ID = process.env.NOTION_NEWS_DB_ID;
const PUBLIC_PAGE_ID = process.env.NOTION_PUBLIC_PAGE_ID;
const DAILY_NEWS_PAGE_ID = process.env.NOTION_DAILY_NEWS_PAGE_ID;
const GITHUB_PAGES_URL = process.env.NOTION_WEB_URL || 'https://hxjnz.github.io/ai-news-daily/';
const NOTION_VERSION = '2022-06-28';
// Use 2025-09-03 only for Create page request when using position (insert at top)
const NOTION_VERSION_NEW = '2025-09-03';

if (!DAILY_NEWS_PAGE_ID && !PUBLIC_PAGE_ID && !NEWS_DB_ID) {
    console.error('❌ Set NOTION_DAILY_NEWS_PAGE_ID (insert at top under AI 每日新闻), NOTION_PUBLIC_PAGE_ID (single page), or NOTION_NEWS_DB_ID (database) in .env');
    process.exit(1);
}

// Today's date formatting (NZ timezone)
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const dateStrCN = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

// Local HTML path for "open full page locally"
const LOCAL_HTML_DIR = process.env.LOCAL_HTML_DIR || path.join(process.env.HOME || '', 'Desktop', 'ai-news-daily');
const localHtmlPath = path.join(LOCAL_HTML_DIR, `AI_Daily_News_${dateStr}.html`).replace(/\\/g, '/');
const LOCAL_FILE_URL = (localHtmlPath.startsWith('/') ? 'file://' : 'file:///') + localHtmlPath;
const WEB_BACKUP_URL = process.env.NOTION_WEB_URL || GITHUB_PAGES_URL;

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
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        method: 'GET', headers,
    });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

async function notionPatch(endpoint, body) {
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        method: 'PATCH', headers,
        body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
    return data;
}

async function notionDelete(endpoint) {
    const resp = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        method: 'DELETE', headers,
    });
    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || `Notion API: ${resp.status}`);
    }
}

// ---------------------------------------------------------------------------
// Page content builder
// ---------------------------------------------------------------------------

function buildNotionBlocks(useLocalFileLink = true) {
    const blocks = [];
    const fileNameSegment = useLocalFileLink
        ? { type: "text", text: { content: `AI_Daily_News_${dateStr}.html`, link: { url: LOCAL_FILE_URL } }, annotations: { bold: true } }
        : { type: "text", text: { content: `AI_Daily_News_${dateStr}.html` }, annotations: { bold: true } };

    blocks.push({
        object: "block", type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "🖥️ 首选：在本地打开 " } },
                fileNameSegment,
                { type: "text", text: { content: `（路径：${localHtmlPath}）。备用：下方书签为网页版。` } },
            ],
            icon: { emoji: "✨" }, color: "blue_background"
        }
    });
    blocks.push({
        object: "block", type: "paragraph",
        paragraph: {
            rich_text: [
                { type: "text", text: { content: "📋 复制到终端一键打开：" }, annotations: { bold: true } },
                { type: "text", text: { content: ` open ${localHtmlPath}` }, annotations: { code: true } },
            ]
        }
    });

    blocks.push({
        object: "block", type: "bookmark",
        bookmark: { url: WEB_BACKUP_URL, caption: [{ type: "text", text: { content: `备用 - 网页版（若无法打开本地文件） · 本地文件：AI_Daily_News_${dateStr}.html` } }] }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    blocks.push({
        object: "block", type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: `📅 ${dateStrCN}  |  🕐 09:30 更新  |  📰 30+ 条新闻  |  🌐 12+ 来源` } }],
            icon: { emoji: "🤖" }, color: "purple_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    blocks.push({
        object: "block", type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📌 今日要闻速览" } }] }
    });

    const topNews = [
        { emoji: "💰", title: "Anthropic 完成 $300 亿 G 轮融资，估值 $3800 亿", tag: "融资", summary: "GIC 和 Coatue 领投，年化收入 $140 亿，Claude Code 年化收入 $25 亿。OpenAI 同期寻求 $1000 亿融资。" },
        { emoji: "🚪", title: "xAI 联合创始人大逃亡：12 人团队已走一半", tag: "产业动态", summary: "Tony Wu 和 Jimmy Ba 48 小时内相继离职。内部不满 Grok NSFW 内容、安全协议被忽视，SpaceX 收购 xAI 推进中。" },
        { emoji: "📢", title: "ChatGPT 正式测试广告，Anthropic 宣布 Claude 永不投广告", tag: "重大发布", summary: "OpenAI 面向 Free/Go 用户上线广告测试，根据对话主题匹配。Anthropic 趁势超级碗广告嘲讽，宣布 Claude 永远无广告。" },
        { emoji: "👔", title: "IBM 发现 AI 局限性后将初级岗位招聘量增加两倍", tag: "产业动态", summary: "新岗位侧重客户交互和 AI 监督而非传统编码，标志企业界对'AI 取代一切'叙事的重大修正。" },
        { emoji: "🎬", title: "Disney 向字节跳动发律师函：Seedance 2.0 侵权", tag: "政策法规", summary: "指控 Seedance 2.0 将 Star Wars、Marvel 角色当公共素材生成视频。同时 Disney 与 OpenAI 签 $10 亿授权协议。" },
    ];

    topNews.forEach((news) => {
        blocks.push({
            object: "block", type: "toggle",
            toggle: {
                rich_text: [
                    { type: "text", text: { content: `${news.emoji} ` } },
                    { type: "text", text: { content: news.title }, annotations: { bold: true } },
                    { type: "text", text: { content: `  [${news.tag}]` }, annotations: { color: "gray" } }
                ],
                children: [{
                    object: "block", type: "paragraph",
                    paragraph: { rich_text: [{ type: "text", text: { content: news.summary } }] }
                }]
            }
        });
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    blocks.push({
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "📊 分类统计" } }] }
    });

    [
        { emoji: "🚀", label: "重大发布", count: "6" },
        { emoji: "📊", label: "研究突破", count: "3" },
        { emoji: "💼", label: "产业动态", count: "8" },
        { emoji: "🏛️", label: "政策法规", count: "6" },
        { emoji: "🛠️", label: "工具开源", count: "3" },
    ].forEach(stat => {
        blocks.push({
            object: "block", type: "callout",
            callout: {
                rich_text: [
                    { type: "text", text: { content: `${stat.label}: ` } },
                    { type: "text", text: { content: stat.count }, annotations: { bold: true, color: "blue" } },
                    { type: "text", text: { content: " 条" } }
                ],
                icon: { emoji: stat.emoji }, color: "gray_background"
            }
        });
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    blocks.push({
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "📈 本周热门趋势" } }] }
    });

    blocks.push({
        object: "block", type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "AI安全&人才流失 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+55%" }, annotations: { color: "red" } },
                { type: "text", text: { content: "  •  " } },
                { type: "text", text: { content: "推理成本革命 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+40%" }, annotations: { color: "green" } },
                { type: "text", text: { content: "  •  " } },
                { type: "text", text: { content: "AI版权诉讼战 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+35%" }, annotations: { color: "green" } },
                { type: "text", text: { content: "  •  " } },
                { type: "text", text: { content: "中国大模型竞赛 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+30%" }, annotations: { color: "green" } },
            ],
            icon: { emoji: "🔥" }, color: "red_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    blocks.push({
        object: "block", type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "👆 首选在本地打开 " } },
                { type: "text", text: { content: `AI_Daily_News_${dateStr}.html` }, annotations: { bold: true } },
                { type: "text", text: { content: " 获得最佳阅读体验；备用 " } },
                { type: "text", text: { content: "网页版", link: { url: WEB_BACKUP_URL } }, annotations: { bold: true } },
                { type: "text", text: { content: "（支持深色模式、动画效果）" }, annotations: { color: "gray" } },
            ],
            icon: { emoji: "💡" }, color: "yellow_background"
        }
    });

    blocks.push({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: "由 Cursor AI 自动生成 · Powered by AI News Daily Skill" }, annotations: { italic: true, color: "gray" } }] }
    });

    return blocks;
}

// ---------------------------------------------------------------------------
// Update existing page (for "Publish to web" – one stable public URL)
// ---------------------------------------------------------------------------

async function updateExistingPage(pageId) {
    let cursor;
    do {
        const path = cursor
            ? `blocks/${pageId}/children?page_size=100&start_cursor=${encodeURIComponent(cursor)}`
            : `blocks/${pageId}/children?page_size=100`;
        const list = await notionGet(path);
        for (const block of list.results || []) {
            await notionDelete(`blocks/${block.id}`);
        }
        cursor = list.next_cursor;
    } while (cursor);

    await notionPatch(`pages/${pageId}`, {
        icon: { type: 'emoji', emoji: '🤖' },
    });

    const blocks = buildNotionBlocks();
    const CHUNK = 100;
    for (let i = 0; i < blocks.length; i += CHUNK) {
        await notionPost(`blocks/${pageId}/children`, {
            children: blocks.slice(i, i + CHUNK),
        });
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function createChildPageUnderDailyNews() {
    const title = `AI 每日速报 ${dateStr}`;
    // Notion API rejects file:// URLs ("Invalid URL for link"); use false so publish succeeds
    let blocks = buildNotionBlocks(false);
    const body = {
        parent: { type: 'page_id', page_id: DAILY_NEWS_PAGE_ID },
        properties: { title: { title: [{ text: { content: title } }] } },
        icon: { type: 'emoji', emoji: '🤖' },
        cover: {
            type: 'external',
            external: { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200' }
        },
        children: blocks.slice(0, 100),
        position: { type: 'page_start' },
    };
    let page;
    try {
        page = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Notion-Version': NOTION_VERSION_NEW,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }).then(r => r.json());
        if (page.object === 'error') throw new Error(page.message);
    } catch (err) {
        if (err.message && /url|link|file|invalid|protocol/i.test(err.message)) {
            blocks = buildNotionBlocks(false);
            body.children = blocks.slice(0, 100);
        }
        delete body.position;
        if (!page) {
            try {
                page = await notionPost('pages', body);
            } catch (e2) {
                throw new Error(`Notion create failed: ${e2.message}`);
            }
        }
    }
    const pageId = page && (typeof page.id === 'string' ? page.id : (page.results && page.results[0] && page.results[0].id));
    if (!pageId) {
        const errDetail = page && page.object === 'error' ? page.message : (page ? 'response missing id' : 'no page');
        throw new Error(`Failed to create Notion page: ${errDetail}`);
    }
    for (let i = 100; i < blocks.length; i += 100) {
        await notionPost(`blocks/${pageId}/children`, {
            children: blocks.slice(i, i + 100),
        });
    }
    return pageId;
}

async function publishToNotion() {
    console.log("🚀 Starting Notion publish...");
    console.log(`📅 Date: ${dateStrCN}`);

    try {
        if (DAILY_NEWS_PAGE_ID) {
            console.log("📌 Mode: create new page under AI 每日新闻 (insert at top)");
            const pageId = await createChildPageUnderDailyNews();
            console.log("✅ Successfully created Notion page under AI 每日新闻!");
            console.log(`🔗 Notion: https://notion.so/${pageId.replace(/-/g, '')}`);
            console.log("💡 Primary: open local file AI_Daily_News_*.html; backup: bookmark = web version.");
        } else if (PUBLIC_PAGE_ID) {
            console.log("📄 Mode: update single page (for Publish to web)");
            await updateExistingPage(PUBLIC_PAGE_ID);
            const shortId = PUBLIC_PAGE_ID.replace(/-/g, '').slice(0, 32);
            console.log("✅ Successfully updated Notion page!");
            console.log(`🔗 Notion: https://notion.so/${shortId}`);
            console.log("💡 Enable «Publish to web» on this page once for a stable public URL (no GitHub).");
        } else {
            console.log(`🌐 Web URL: ${GITHUB_PAGES_URL}`);
            const page = await notionPost('pages', {
                parent: { type: "database_id", database_id: NEWS_DB_ID },
                icon: { type: "emoji", emoji: "🤖" },
                cover: {
                    type: "external",
                    external: { url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200" }
                },
                properties: {
                    Name: { title: [{ text: { content: `AI 每日速报 ${dateStr}` } }] },
                    Date: { date: { start: dateStr } },
                    URL: { url: WEB_BACKUP_URL },
                    Tags: { multi_select: [{ name: '重大发布' }, { name: '产业动态' }, { name: '政策法规' }] },
                },
                children: buildNotionBlocks()
            });
            console.log("✅ Successfully created Notion page!");
            console.log(`🔗 Notion URL: https://notion.so/${page.id.replace(/-/g, '')}`);
            console.log(`🌐 Web URL: ${GITHUB_PAGES_URL}`);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

publishToNotion();
