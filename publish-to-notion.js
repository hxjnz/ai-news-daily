/**
 * AI Daily News - Notion Publisher
 * Creates a beautiful page with embedded web link
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
const GITHUB_PAGES_URL = 'https://hxjnz.github.io/ai-news-daily/';

// Today's date formatting
const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const dateStrCN = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

// Build Notion blocks with web embed
function buildNotionBlocks() {
    const blocks = [];

    // Hero callout with link
    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "🌐 " } },
                { type: "text", text: { content: "点击查看完整精美网页版 →", link: { url: GITHUB_PAGES_URL } }, annotations: { bold: true, color: "blue" } },
            ],
            icon: { emoji: "✨" },
            color: "blue_background"
        }
    });

    // Embed bookmark
    blocks.push({
        object: "block",
        type: "bookmark",
        bookmark: {
            url: GITHUB_PAGES_URL,
            caption: [{ type: "text", text: { content: "AI 每日速报 - 精美网页版（支持深色模式）" } }]
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Stats header
    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: `📅 ${dateStrCN}  |  🕐 15:30 更新  |  📰 25+ 条新闻  |  🌐 10+ 来源` } }],
            icon: { emoji: "🤖" },
            color: "purple_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Quick summary section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📌 今日要闻速览" } }] }
    });

    // Top 5 news as toggle blocks
    const topNews = [
        { emoji: "🎵", title: "音乐出版商起诉 Anthropic 30亿美元", tag: "政策法规", summary: "指控 Claude 训练中未经授权使用 2 万部版权作品" },
        { emoji: "🚗", title: "Tesla 向 xAI 投资 20 亿美元", tag: "产业动态", summary: "Musk AI 帝国持续整合，SpaceX 也在谈合并" },
        { emoji: "💰", title: "Anthropic 融资额增至 200 亿美元", tag: "融资", summary: "AI 资本竞争白热化，头部公司估值攀升" },
        { emoji: "🌍", title: "Google DeepMind 发布 Project Genie", tag: "研究突破", summary: "无限交互式世界生成，通向 AGI 的重要一步" },
        { emoji: "🔗", title: "Anthropic 将 Slack/Figma 嵌入 Claude", tag: "重大发布", summary: "集成 9 款工作应用，打造 AI 工作指挥中心" },
    ];

    topNews.forEach((news, i) => {
        blocks.push({
            object: "block",
            type: "toggle",
            toggle: {
                rich_text: [
                    { type: "text", text: { content: `${news.emoji} ` } },
                    { type: "text", text: { content: news.title }, annotations: { bold: true } },
                    { type: "text", text: { content: `  [${news.tag}]` }, annotations: { color: "gray" } }
                ],
                children: [
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [{ type: "text", text: { content: news.summary } }]
                        }
                    }
                ]
            }
        });
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Category summary
    blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "📊 分类统计" } }] }
    });

    // Stats as callouts
    const stats = [
        { emoji: "🚀", label: "重大发布", count: "8" },
        { emoji: "📊", label: "研究突破", count: "5" },
        { emoji: "💼", label: "产业动态", count: "8" },
        { emoji: "🏛️", label: "政策法规", count: "5" },
        { emoji: "🛠️", label: "工具开源", count: "5" },
    ];

    stats.forEach(stat => {
        blocks.push({
            object: "block",
            type: "callout",
            callout: {
                rich_text: [
                    { type: "text", text: { content: `${stat.label}: ` } },
                    { type: "text", text: { content: stat.count }, annotations: { bold: true, color: "blue" } },
                    { type: "text", text: { content: " 条" } }
                ],
                icon: { emoji: stat.emoji },
                color: "gray_background"
            }
        });
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Trends
    blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "📈 本周热门趋势" } }] }
    });

    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "AI Agent " }, annotations: { bold: true } },
                { type: "text", text: { content: "+25%" }, annotations: { color: "green" } },
                { type: "text", text: { content: "  •  " } },
                { type: "text", text: { content: "版权诉讼 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+40%" }, annotations: { color: "green" } },
                { type: "text", text: { content: "  •  " } },
                { type: "text", text: { content: "企业AI集成 " }, annotations: { bold: true } },
                { type: "text", text: { content: "+15%" }, annotations: { color: "green" } },
            ],
            icon: { emoji: "🔥" },
            color: "red_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Footer with link
    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: [
                { type: "text", text: { content: "👆 " } },
                { type: "text", text: { content: "查看完整网页版", link: { url: GITHUB_PAGES_URL } }, annotations: { bold: true } },
                { type: "text", text: { content: " 获得最佳阅读体验（支持深色模式、动画效果）" }, annotations: { color: "gray" } },
            ],
            icon: { emoji: "💡" },
            color: "yellow_background"
        }
    });

    blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
            rich_text: [
                { type: "text", text: { content: "由 Cursor AI 自动生成 · Powered by AI News Daily Skill" }, annotations: { italic: true, color: "gray" } }
            ]
        }
    });

    return blocks;
}

// Main function
async function publishToNotion() {
    console.log("🚀 Starting Notion publish...");
    console.log(`📅 Date: ${dateStrCN}`);
    console.log(`🌐 Web URL: ${GITHUB_PAGES_URL}`);

    try {
        const response = await notion.pages.create({
            parent: {
                type: "page_id",
                page_id: PARENT_PAGE_ID,
            },
            icon: { type: "emoji", emoji: "🤖" },
            cover: {
                type: "external",
                external: { url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200" }
            },
            properties: {
                title: {
                    title: [{ text: { content: `AI 每日速报 ${dateStr}` } }]
                }
            },
            children: buildNotionBlocks()
        });

        console.log("✅ Successfully created Notion page!");
        console.log(`🔗 Notion URL: https://notion.so/${response.id.replace(/-/g, '')}`);
        console.log(`🌐 Web URL: ${GITHUB_PAGES_URL}`);
        return response;

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    }
}

publishToNotion();
