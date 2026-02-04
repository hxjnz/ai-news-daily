/**
 * AI Daily News - Report Generator
 * Uses Claude API to generate Chinese news summaries and HTML report
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { fetchAllNews } = require('./fetch-news');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TEMPLATE_PATH = path.join(__dirname, '..', 'template.html');

// Call Claude API
async function callClaude(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            messages: [{ role: 'user', content: prompt }]
        });

        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.content && response.content[0]) {
                        resolve(response.content[0].text);
                    } else if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        reject(new Error('Invalid API response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Generate news summary using Claude
async function generateNewsSummary(newsItems) {
    console.log('\n🤖 Generating AI summary with Claude...');
    
    const newsText = newsItems.slice(0, 30).map((item, i) => 
        `${i + 1}. [${item.source}] ${item.title}\n   Link: ${item.link}\n   ${item.description || ''}`
    ).join('\n\n');

    const prompt = `You are an AI news curator. Analyze these AI news items and create a structured JSON summary in Chinese.

NEWS ITEMS:
${newsText}

Create a JSON response with this EXACT structure (respond ONLY with valid JSON, no markdown):
{
    "date": "YYYY-MM-DD format today's date",
    "dateCN": "YYYY年MM月DD日 format",
    "topStories": [
        {
            "title": "Chinese title",
            "titleEN": "Original English title",
            "description": "2-3 sentence Chinese summary",
            "category": "one of: 重大发布/研究突破/产业动态/政策法规/工具开源",
            "source": "source name",
            "link": "original link",
            "impact": "one sentence impact analysis in Chinese"
        }
    ],
    "releases": [
        {
            "title": "Chinese title",
            "company": "company name",
            "description": "1-2 sentence Chinese description",
            "tags": ["tag1", "tag2"],
            "date": "MM-DD"
        }
    ],
    "research": [
        {
            "title": "Research title",
            "org": "organization",
            "description": "Chinese description"
        }
    ],
    "industry": [
        {
            "title": "Chinese title",
            "type": "融资/合作/裁员/etc",
            "amount": "$XXM or empty",
            "description": "short description"
        }
    ],
    "policy": [
        {
            "title": "Chinese title",
            "region": "country/region",
            "description": "Chinese description"
        }
    ],
    "tools": [
        {
            "name": "Tool name",
            "description": "Chinese description",
            "tags": ["tag1", "tag2"]
        }
    ],
    "trends": [
        {"topic": "Topic name", "change": "+XX%"},
        {"topic": "Topic name", "change": "+XX%"}
    ],
    "keywords": ["keyword1", "keyword2", "keyword3"]
}

Select the TOP 5 most important stories for topStories. Include 4-6 items for releases, 3 for research, 4 for industry, 3-4 for policy, 3 for tools. Ensure all text is in Simplified Chinese except for technical terms, company names, and product names which should stay in English.`;

    const response = await callClaude(prompt);
    
    // Parse JSON from response
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
    } catch (e) {
        console.error('Error parsing Claude response:', e.message);
        console.log('Raw response:', response.substring(0, 500));
        throw e;
    }
}

// Generate HTML from template and data
function generateHTML(data) {
    const today = new Date();
    const dateStr = data.date || today.toISOString().split('T')[0];
    const dateCN = data.dateCN || `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;
    
    // Generate top stories HTML
    const topStoriesHTML = (data.topStories || []).map(story => `
                <article class="news-card glass-card rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="category-badge px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold uppercase">${story.category}</span>
                        <span class="category-badge px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">${story.source}</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                        ${story.title}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                        ${story.description}
                    </p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-400">影响分析: ${story.impact || ''}</span>
                        <a href="${story.link}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium hover:opacity-80 transition-opacity">
                            阅读原文 →
                        </a>
                    </div>
                </article>`).join('\n');

    // Generate releases HTML
    const releasesHTML = (data.releases || []).map(release => `
                <article class="news-card glass-card rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <div class="flex items-start justify-between mb-4">
                        <span class="category-badge px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">${release.company}</span>
                        <span class="text-sm text-gray-400">${release.date}</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">${release.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${release.description}</p>
                    <div class="flex gap-2">
                        ${(release.tags || []).map(tag => `<span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">${tag}</span>`).join('')}
                    </div>
                </article>`).join('\n');

    // Generate research HTML
    const researchHTML = (data.research || []).map(item => `
                <article class="news-card glass-card rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl mb-4">📄</div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${item.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${item.org}</p>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">${item.description}</p>
                </article>`).join('\n');

    // Generate industry HTML
    const industryHTML = (data.industry || []).map(item => `
                <article class="news-card glass-card rounded-xl p-5 shadow-md border border-gray-200/50 dark:border-gray-700/50">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-2xl">💼</span>
                        <span class="text-sm font-semibold text-green-600 dark:text-green-400">${item.type}${item.amount ? ' ' + item.amount : ''}</span>
                    </div>
                    <h3 class="font-bold text-gray-900 dark:text-white mb-2">${item.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">${item.description}</p>
                </article>`).join('\n');

    // Generate policy HTML
    const policyHTML = (data.policy || []).map((item, i) => {
        const colors = ['red', 'blue', 'green', 'purple'];
        const color = colors[i % colors.length];
        return `
                <article class="news-card glass-card rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-l-4 border-l-${color}-500">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-sm px-2 py-1 rounded bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400">${item.region}</span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${item.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">${item.description}</p>
                </article>`;
    }).join('\n');

    // Generate tools HTML
    const toolsHTML = (data.tools || []).map((item, i) => `
                <article class="news-card glass-card rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${i === 0 ? 'relative overflow-hidden' : ''}">
                    ${i === 0 ? '<div class="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-bl-xl">🔥 HOT</div>' : ''}
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 ${i === 0 ? 'mt-4' : ''}">${item.name}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${item.description}</p>
                    <div class="flex gap-2">
                        ${(item.tags || []).map(tag => `<span class="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">${tag}</span>`).join('')}
                    </div>
                </article>`).join('\n');

    // Generate trends HTML
    const trendsHTML = (data.trends || []).map((trend, i) => {
        const widths = ['95%', '85%', '75%', '65%'];
        const gradients = [
            'trending-bar',
            'bg-gradient-to-r from-purple-500 to-pink-500',
            'bg-gradient-to-r from-red-500 to-orange-500',
            'bg-gradient-to-r from-blue-500 to-cyan-500'
        ];
        return `
                        <div>
                            <div class="flex justify-between mb-2">
                                <span class="font-semibold text-gray-900 dark:text-white">${trend.topic}</span>
                                <span class="text-green-500 font-bold">↗️ ${trend.change}</span>
                            </div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full w-[${widths[i] || '60%'}] ${gradients[i] || gradients[0]} rounded-full"></div>
                            </div>
                        </div>`;
    }).join('\n');

    // Generate keywords HTML
    const keywordsHTML = (data.keywords || []).map((kw, i) => {
        const sizes = ['text-3xl font-bold', 'text-2xl font-semibold', 'text-xl font-bold', 'text-2xl font-semibold', 'text-lg', 'text-xl font-bold'];
        const colors = ['text-purple-600 dark:text-purple-400', 'text-blue-600 dark:text-blue-400', 'text-green-600 dark:text-green-400', 'text-orange-600 dark:text-orange-400', 'text-red-600 dark:text-red-400', 'text-pink-600 dark:text-pink-400'];
        return `<span class="${sizes[i % sizes.length]} ${colors[i % colors.length]}">${kw}</span>`;
    }).join('\n                        ');

    // Stats
    const stats = {
        total: (data.topStories?.length || 0) + (data.releases?.length || 0) + (data.research?.length || 0) + (data.industry?.length || 0) + (data.policy?.length || 0) + (data.tools?.length || 0),
        releases: data.releases?.length || 0,
        research: data.research?.length || 0,
        industry: data.industry?.length || 0,
        tools: data.tools?.length || 0,
        policy: data.policy?.length || 0
    };

    // Read template and replace placeholders
    let template;
    try {
        template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    } catch (e) {
        // Use inline template if file not found
        template = getDefaultTemplate();
    }

    // Replace all placeholders
    const html = template
        .replace(/2026-01-30/g, dateStr)
        .replace(/2026年01月30日/g, dateCN)
        .replace(/<!-- TOP_STORIES_PLACEHOLDER -->/g, topStoriesHTML)
        .replace(/<!-- RELEASES_PLACEHOLDER -->/g, releasesHTML)
        .replace(/<!-- RESEARCH_PLACEHOLDER -->/g, researchHTML)
        .replace(/<!-- INDUSTRY_PLACEHOLDER -->/g, industryHTML)
        .replace(/<!-- POLICY_PLACEHOLDER -->/g, policyHTML)
        .replace(/<!-- TOOLS_PLACEHOLDER -->/g, toolsHTML)
        .replace(/<!-- TRENDS_PLACEHOLDER -->/g, trendsHTML)
        .replace(/<!-- KEYWORDS_PLACEHOLDER -->/g, keywordsHTML)
        .replace(/25\+/g, `${stats.total}+`)
        .replace(/"8"(?=.*重大发布)/g, `"${stats.releases}"`)
        .replace(/"5"(?=.*研究)/g, `"${stats.research}"`)
        .replace(/"8"(?=.*产业)/g, `"${stats.industry}"`)
        .replace(/"5"(?=.*开源)/g, `"${stats.tools}"`)
        .replace(/"5"(?=.*政策)/g, `"${stats.policy}"`);

    return html;
}

// Default HTML template
function getDefaultTemplate() {
    return fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf8');
}

// Main function
async function main() {
    if (!ANTHROPIC_API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY not set in environment');
        process.exit(1);
    }

    console.log('🚀 Starting AI Daily News generation...\n');
    
    // Fetch news
    const news = await fetchAllNews();
    
    // Generate summary with Claude
    const summary = await generateNewsSummary(news.all);
    
    // Generate HTML
    console.log('\n📝 Generating HTML report...');
    const html = generateHTML(summary);
    
    // Save files
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const outputPath = path.join(__dirname, '..', `AI_Daily_News_${dateStr}.html`);
    const docsPath = path.join(__dirname, '..', 'docs', 'index.html');
    
    fs.writeFileSync(outputPath, html);
    fs.writeFileSync(docsPath, html);
    
    console.log(`\n✅ Report generated successfully!`);
    console.log(`   📄 ${outputPath}`);
    console.log(`   📄 ${docsPath}`);
    
    // Save summary JSON for Notion publisher
    const summaryPath = path.join(__dirname, '..', 'latest-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`   📋 ${summaryPath}`);
    
    return summary;
}

module.exports = { generateNewsSummary, generateHTML };

if (require.main === module) {
    main().catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
}
