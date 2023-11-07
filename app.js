const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const dataDirectory = path.join(__dirname, 'data');

// Endpoint to read the JSON file and send it to the front-end
app.get('/data', (req, res) => {
    fs.readFile('data/CS_parsed.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the JSON file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (error) {
            console.error('Error parsing JSON data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// TODO sanitize!
// Path traversal is possible here
app.post('/getData', (req, res) => {
    const major = req.body;

    let majorData = null;
    let optionData = null;

    // Read major requirements
    if (!major.selectedMajor)
        return res.status(400).send('missing major');

    // Dangerous?!
    fs.readFile('data/'+major.selectedMajor+'/reqs.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the JSON file:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        try {
            majorData = JSON.parse(data);

            if (!major.selectedOption) {
                // Respond with majorData if no option selected
                return res.json([majorData]);
            }

            // Read option requirements
            // Dangerous?!
            fs.readFile('data/'+major.selectedMajor+'/'+major.selectedOption+'.json', 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading the JSON file:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                try {
                    optionData = JSON.parse(data);

                    // Respond with both majorData and optionData
                    return res.json([majorData, optionData]);
                } catch (error) {
                    console.error('Error parsing JSON data:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
            });
        } catch (error) {
            console.error('Error parsing JSON data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
