const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ApifyClient } = require('apify-client');

const app = express();
const PORT = process.env.PORT || 8880;

app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

const FILE_PATH = path.join(__dirname, 'data.html');

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: 'apify_api_NREiWnC8e6M8yc2bl2K8cFJx2zyGQH44lDvA',
});

// Base input for the Apify Google Search Actor
// We'll use this as a template and modify the keyword as needed
const baseInput = {
    "keyword": "JavaScript",
    "maxItems": 20,
    "filter": "all",
    "sortBy": "relevance",
    "articleType": "any",
    "proxyOptions": {
        "useApifyProxy": true
    },
    "enableDebugDumps": false
};

async function googleSearch(query) {
    const input = { ...baseInput, keyword: query };

    // Run the Actor and wait for it to finish
    const run = await client.actor("kdjLO0hegCjr5Ejqp").call(input);

    // Fetch Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Return items (transform or return raw)
    return items;
}

async function searchPapers(query) {
    const endpoint = 'https://api.semanticscholar.org/graph/v1/paper/search';

    async function doSearch(searchQuery) {
        const params = {
            query: searchQuery,
            fields: 'title,abstract,authors,year,url',
            limit: 10,
            offset: 0
        };
        return await axios.get(endpoint, { params });
    }

    try {
        let response = await doSearch(query);

        if (response.data && response.data.total === 0) {
            console.log("No results found from Semantic Scholar. Trying Google search via Apify...");
            // Fallback to Google search using Apify
            const googleResults = await googleSearch(query);

            // Wrap results in a similar structure as Semantic Scholar would provide 
            // This is optional and depends on how you want to handle the data
            return {
                from: 'google',
                data: googleResults
            };
        }

        return {
            from: 'semanticScholar',
            data: response.data
        };

    } catch (error) {
        console.error('Error searching for papers:', error.response?.data || error.message);
        throw error;
    }
}


// GET route - load the editor and insert saved content
app.get('/app', (req, res) => {
    let savedContent = '';
    if (fs.existsSync(FILE_PATH)) {
        savedContent = fs.readFileSync(FILE_PATH, 'utf8');
    }
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// GET route - load the editor and insert saved content
app.get('/', (req, res) => {
    let savedContent = '';
    if (fs.existsSync(FILE_PATH)) {
        savedContent = fs.readFileSync(FILE_PATH, 'utf8');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/search', (req, res) => {
    let queryString = req.body.queryString;
    searchPapers(queryString)
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(429).json({
                'message': 'Error RATE LIMITED'
            });
        });
});

// POST route - save the editor content
app.post('/save', (req, res) => {
    const content = req.body.content || '';
    fs.writeFileSync(FILE_PATH, content, 'utf8');
    res.json({ status: 'success' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
