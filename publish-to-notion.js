/**
 * AI Daily News - Notion Publisher
 * Automatically creates a new page under the parent page with today's AI news
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

// Today's date formatting
const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const dateStrCN = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

// News data structure
const newsData = {
    topStories: [
        {
            title: "音乐出版商起诉 Anthropic 30亿美元，指控「公然盗版」2万部作品",
            category: "政策法规",
            source: "TechCrunch",
            summary: "多家主要音乐出版商对 Anthropic 提起 30 亿美元诉讼，指控其 Claude AI 模型在训练过程中未经授权使用了超过 2 万部受版权保护的音乐作品。",
            url: "https://techcrunch.com/2026/01/29/music-publishers-sue-anthropic-for-3b-over-flagrant-piracy-of-20000-works/",
            impact: "可能推动 AI 版权法规更新"
        },
        {
            title: "Tesla 向 Elon Musk 的 xAI 投资 20 亿美元",
            category: "产业动态",
            source: "TechCrunch",
            summary: "Tesla 在财报中披露向 xAI 投资 20 亿美元。据报道，xAI 在 2025 年前 9 个月烧掉了约 78 亿美元。SpaceX 也在与 xAI 进行合并谈判。",
            url: "https://techcrunch.com/2026/01/28/tesla-invested-2b-in-elon-musks-xai/",
            impact: "Musk AI 帝国持续整合"
        },
        {
            title: "Anthropic 融资额据报已增至 200 亿美元",
            category: "融资",
            source: "TechCrunch",
            summary: "Anthropic 据报道已将其最新一轮融资提升至 200 亿美元，进一步巩固其作为 AI 领域领先企业的地位。",
            url: "https://techcrunch.com/2026/01/27/anthropic-reportedly-upped-its-latest-raise-to-20b/",
            impact: "AI 资本竞争白热化"
        },
        {
            title: "Google DeepMind 发布 Project Genie：无限交互式世界生成",
            category: "研究突破",
            source: "Google Blog",
            summary: "Google DeepMind 发布 Project Genie，能够生成无限、可交互虚拟世界的 AI 系统。",
            url: "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/",
            impact: "世界模型是通向 AGI 的重要一步"
        },
        {
            title: "Anthropic 将 Slack、Figma 等应用嵌入 Claude",
            category: "重大发布",
            source: "VentureBeat",
            summary: "Anthropic 推出交互式 Claude 应用，集成 Slack、Figma、Asana、Canva 等 9 款主流工作应用。",
            url: "https://venturebeat.com/infrastructure/anthropic-embeds-slack-figma-and-asana-inside-claude-turning-ai-chat-into-a",
            impact: "企业 AI 市场格局可能被重塑"
        }
    ],
    releases: [
        { title: "OpenAI 推出 Prism：面向科学家的 AI 工作空间", source: "OpenAI", tags: ["科研工具", "AI平台"] },
        { title: "Chrome 集成 Gemini，推出 Auto Browse 自动浏览功能", source: "Google", tags: ["浏览器", "Agent"] },
        { title: "Mistral 发布 Vibe 2.0，挑战 GitHub Copilot", source: "Mistral", tags: ["代码助手", "欧洲AI"] },
        { title: "Microsoft 发布 Maia 200 AI 芯片", source: "Microsoft", tags: ["AI芯片", "硬件"] },
        { title: "Arcee AI 构建 400B 参数开源 LLM，超越 Llama", source: "Arcee AI", tags: ["开源模型", "LLM"] },
    ],
    research: [
        { title: "Qwen3-Max Thinking 在 Humanity's Last Exam 超越 Gemini 3 Pro", org: "阿里巴巴", field: "LLM/推理" },
        { title: "Kimi K2.5：最强开源 LLM，超越 Opus 4.5", org: "Moonshot AI", field: "LLM/Agent" },
        { title: "AI 从哈勃档案中发现 1400 个异常天体", org: "ESA", field: "天文学/CV" },
    ],
    industry: [
        { title: "Waabi 融资 10 亿美元，与 Uber 拓展机器人出租车", amount: "$1B" },
        { title: "ServiceNow 与 Anthropic 达成 AI 合作", amount: "合作" },
        { title: "Pinterest 裁员 15% 以专注 AI 转型", amount: "裁员" },
        { title: "Google AI Plus 计划在 35 个国家推出", amount: "$7.99/月" },
    ],
    policy: [
        { title: "ADL 报告：Grok 是最具反犹太主义的聊天机器人", region: "美国" },
        { title: "欧盟调查 X 平台 Grok 生成性化 Deepfake", region: "欧盟" },
        { title: "Google 探索让出版商退出搜索 AI 功能", region: "英国" },
        { title: "白宫将 AI 时代与工业革命相提并论", region: "美国" },
    ],
    tools: [
        { title: "Moltbot (原 Clawdbot)", desc: "真正能做事的本地 AI Agent", hot: true },
        { title: "Claude Code 基准追踪器", desc: "追踪 Claude Code 性能退化", hot: false },
        { title: "AgentMail (YC S25)", desc: "为 AI Agent 提供独立邮箱", hot: false },
    ],
    trends: [
        { name: "AI Agent / Agentic AI", change: "+25%" },
        { name: "版权诉讼", change: "+40%" },
        { name: "企业 AI 集成", change: "+15%" },
        { name: "开源模型竞争", change: "持平" },
    ]
};

// Category emoji mapping
const categoryEmoji = {
    "政策法规": "🏛️",
    "产业动态": "💼",
    "融资": "💰",
    "研究突破": "📊",
    "重大发布": "🚀",
};

// Build Notion blocks
function buildNotionBlocks() {
    const blocks = [];

    // Header with stats
    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: [{ type: "text", text: { content: `📅 ${dateStrCN}  |  🕐 15:30 更新  |  📰 25+ 条新闻  |  🌐 10+ 来源` } }],
            icon: { emoji: "🤖" },
            color: "blue_background"
        }
    });

    blocks.push({ object: "block", type: "divider", divider: {} });

    // Top Stories Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📌 今日要闻 Top Stories" } }] }
    });

    newsData.topStories.forEach((story, index) => {
        const emoji = categoryEmoji[story.category] || "📰";
        
        blocks.push({
            object: "block",
            type: "heading_3",
            heading_3: { 
                rich_text: [{ type: "text", text: { content: `${index + 1}. ${story.title}` } }],
                color: "default"
            }
        });

        blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [
                    { type: "text", text: { content: `${emoji} ${story.category}` }, annotations: { bold: true, color: "blue" } },
                    { type: "text", text: { content: `  |  📰 ${story.source}` }, annotations: { color: "gray" } }
                ]
            }
        });

        blocks.push({
            object: "block",
            type: "quote",
            quote: {
                rich_text: [{ type: "text", text: { content: story.summary } }],
                color: "default"
            }
        });

        blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [
                    { type: "text", text: { content: "💡 影响分析: " }, annotations: { bold: true } },
                    { type: "text", text: { content: story.impact }, annotations: { italic: true, color: "gray" } },
                    { type: "text", text: { content: "  |  " } },
                    { type: "text", text: { content: "🔗 阅读原文", link: { url: story.url } }, annotations: { color: "blue" } }
                ]
            }
        });

        blocks.push({ object: "block", type: "divider", divider: {} });
    });

    // Major Releases Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "🚀 重大发布 Major Releases" } }] }
    });

    blocks.push({
        object: "block",
        type: "table",
        table: {
            table_width: 3,
            has_column_header: true,
            has_row_header: false,
            children: [
                {
                    type: "table_row",
                    table_row: {
                        cells: [
                            [{ type: "text", text: { content: "产品/功能" }, annotations: { bold: true } }],
                            [{ type: "text", text: { content: "来源" }, annotations: { bold: true } }],
                            [{ type: "text", text: { content: "标签" }, annotations: { bold: true } }]
                        ]
                    }
                },
                ...newsData.releases.map(release => ({
                    type: "table_row",
                    table_row: {
                        cells: [
                            [{ type: "text", text: { content: release.title } }],
                            [{ type: "text", text: { content: release.source } }],
                            [{ type: "text", text: { content: release.tags.join(", ") } }]
                        ]
                    }
                }))
            ]
        }
    });

    // Research Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📊 研究突破 Research" } }] }
    });

    newsData.research.forEach(item => {
        blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [
                    { type: "text", text: { content: item.title }, annotations: { bold: true } },
                    { type: "text", text: { content: ` — ${item.org}` }, annotations: { color: "gray" } },
                    { type: "text", text: { content: ` [${item.field}]` }, annotations: { italic: true, color: "purple" } }
                ]
            }
        });
    });

    // Industry News Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "💼 产业动态 Industry" } }] }
    });

    newsData.industry.forEach(item => {
        blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [
                    { type: "text", text: { content: item.title } },
                    { type: "text", text: { content: ` (${item.amount})` }, annotations: { bold: true, color: "green" } }
                ]
            }
        });
    });

    // Policy Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "🏛️ 政策法规 Policy" } }] }
    });

    newsData.policy.forEach(item => {
        blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [
                    { type: "text", text: { content: `[${item.region}] ` }, annotations: { bold: true, color: "red" } },
                    { type: "text", text: { content: item.title } }
                ]
            }
        });
    });

    // Tools Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "🛠️ 工具与开源 Tools" } }] }
    });

    newsData.tools.forEach(item => {
        const prefix = item.hot ? "🔥 " : "";
        blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [
                    { type: "text", text: { content: `${prefix}${item.title}` }, annotations: { bold: true } },
                    { type: "text", text: { content: ` — ${item.desc}` }, annotations: { color: "gray" } }
                ]
            }
        });
    });

    // Trends Section
    blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: "📈 本周趋势 Trends" } }] }
    });

    blocks.push({
        object: "block",
        type: "callout",
        callout: {
            rich_text: newsData.trends.map((trend, i) => ({
                type: "text",
                text: { content: `${trend.name} ${trend.change}${i < newsData.trends.length - 1 ? "  •  " : ""}` },
                annotations: { color: trend.change.includes("+") ? "green" : "gray" }
            })),
            icon: { emoji: "📊" },
            color: "purple_background"
        }
    });

    // Footer
    blocks.push({ object: "block", type: "divider", divider: {} });
    
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

// Main function to create Notion page
async function publishToNotion() {
    console.log("🚀 Starting Notion publish...");
    console.log(`📅 Date: ${dateStrCN}`);

    try {
        // Create new page under parent
        const response = await notion.pages.create({
            parent: {
                type: "page_id",
                page_id: PARENT_PAGE_ID,
            },
            icon: {
                type: "emoji",
                emoji: "🤖"
            },
            cover: {
                type: "external",
                external: {
                    url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200"
                }
            },
            properties: {
                title: {
                    title: [
                        {
                            text: {
                                content: `AI 每日速报 ${dateStr}`
                            }
                        }
                    ]
                }
            },
            children: buildNotionBlocks()
        });

        console.log("✅ Successfully created Notion page!");
        console.log(`🔗 Page URL: https://notion.so/${response.id.replace(/-/g, '')}`);
        return response;

    } catch (error) {
        console.error("❌ Error creating Notion page:", error.message);
        if (error.body) {
            console.error("Details:", JSON.stringify(error.body, null, 2));
        }
        throw error;
    }
}

// Run
publishToNotion();
