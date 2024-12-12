const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
//dotevn
require('dotenv').config();
const axios = require('axios');
const { ApifyClient } = require('apify-client');

const app = express();
const PORT = process.env.PORT || 8880;

app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

const FILE_PATH = path.join(__dirname, 'data.html');

const client = new ApifyClient({
    token: process.env.apifyToken,
});


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

    const run = await client.actor("kdjLO0hegCjr5Ejqp").call(input);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

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

            const googleResults = await googleSearch(query);


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



app.get('/app', (req, res) => {
    let savedContent = '';
    if (fs.existsSync(FILE_PATH)) {
        savedContent = fs.readFileSync(FILE_PATH, 'utf8');
    }
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

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


app.post('/save', (req, res) => {
    const content = req.body.content || '';
    fs.writeFileSync(FILE_PATH, content, 'utf8');
    res.json({ status: 'success' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
