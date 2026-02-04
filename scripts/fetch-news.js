/**
 * AI Daily News - News Fetcher
 * Fetches AI news from multiple sources using RSS feeds and APIs
 */

const https = require('https');
const http = require('http');

// News sources with RSS feeds or API endpoints
const NEWS_SOURCES = [
    {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        type: 'rss'
    },
    {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
        type: 'rss'
    },
    {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        type: 'rss'
    },
    {
        name: 'OpenAI Blog',
        url: 'https://openai.com/blog/rss/',
        type: 'rss'
    },
    {
        name: 'AI News',
        url: 'https://www.artificialintelligence-news.com/feed/',
        type: 'rss'
    },
    {
        name: 'Hacker News',
        url: 'https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=20',
        type: 'json'
    }
];

// Fetch URL content
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Parse RSS XML to extract items
function parseRSS(xml, sourceName) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        
        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const description = extractTag(itemXml, 'description');
        const pubDate = extractTag(itemXml, 'pubDate');
        
        if (title && link) {
            items.push({
                title: cleanText(title),
                link: cleanText(link),
                description: cleanText(description).substring(0, 500),
                pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                source: sourceName
            });
        }
    }
    
    return items.slice(0, 10); // Limit to 10 items per source
}

// Extract tag content from XML
function extractTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '') : '';
}

// Clean text from HTML and extra whitespace
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Parse Hacker News JSON response
function parseHackerNews(json) {
    try {
        const data = JSON.parse(json);
        return (data.hits || []).map(hit => ({
            title: hit.title,
            link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            description: hit.title,
            pubDate: new Date(hit.created_at).toISOString(),
            source: 'Hacker News',
            points: hit.points
        })).filter(item => item.title && item.link);
    } catch (e) {
        console.error('Error parsing Hacker News:', e.message);
        return [];
    }
}

// Fetch news from a single source
async function fetchFromSource(source) {
    try {
        console.log(`  Fetching: ${source.name}...`);
        const content = await fetchUrl(source.url);
        
        if (source.type === 'json') {
            return parseHackerNews(content);
        } else {
            return parseRSS(content, source.name);
        }
    } catch (error) {
        console.error(`  Error fetching ${source.name}: ${error.message}`);
        return [];
    }
}

// Main function to fetch all news
async function fetchAllNews() {
    console.log('🔍 Fetching AI news from multiple sources...\n');
    
    const allNews = [];
    
    for (const source of NEWS_SOURCES) {
        const news = await fetchFromSource(source);
        allNews.push(...news);
        console.log(`  ✓ ${source.name}: ${news.length} items`);
    }
    
    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Filter to last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNews = allNews.filter(item => new Date(item.pubDate) > oneDayAgo);
    
    console.log(`\n📰 Total news items: ${allNews.length}`);
    console.log(`📅 Recent (24h): ${recentNews.length}`);
    
    return {
        all: allNews.slice(0, 50), // Limit total
        recent: recentNews,
        fetchedAt: new Date().toISOString()
    };
}

// Export for use in other scripts
module.exports = { fetchAllNews, fetchUrl };

// Run if called directly
if (require.main === module) {
    fetchAllNews()
        .then(news => {
            console.log('\n📋 Sample news items:');
            news.recent.slice(0, 5).forEach((item, i) => {
                console.log(`\n${i + 1}. [${item.source}] ${item.title}`);
            });
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
