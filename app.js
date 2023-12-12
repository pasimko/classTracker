const express = require('express');
const app = express();
const fs = require('fs').promises; // Use promises for fs operations
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const dataDirectory = path.join(__dirname, 'data');

function findCrnForCode(jsonArray, targetCode) {
    for (const obj of jsonArray) {
        if (obj.code === targetCode) {
            return obj.crn;
        }
    }
    return null;
}

function flattenArray(arr) {
    return arr.reduce((acc, val) => {
        return acc.concat(Array.isArray(val) ? flattenArray(val) : val);
    }, []);
}

async function callMicroservice(crn, course) {
    return new Promise((resolve, reject) => {
        exec("python micro.py " + crn + " " + course, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error fetching prereqs: ${error.message}`);
                reject(error);
            } else if (stderr) {
                console.error(`Error fetching prereqs: ${stderr}`);
                reject(new Error(stderr));
            } else {
                try {
                    const jsonData = JSON.parse(stdout);
                    resolve(jsonData);
                } catch (jsonError) {
                    reject(jsonError);
                }
            }
        });
    });
}

async function getPrereqs(course) {
    let course_no_spaces = course.replace(/\s/g, '');
    let newPrereqs = null;
    let resultCrn = null;
    let fileFound = false;
    // Check if we have the data stored
    try {
        prereq_file = path.join('data/prereqs/', course_no_spaces + '.json');
        console.log(prereq_file);
        const prereqs = await fs.readFile(prereq_file);
        newPrereqs = JSON.parse(prereqs);
        fileFound = true;
    } catch (error) {
        console.error('Couldn\'t read course from cache', course_no_spaces);
    }
    if (!fileFound) {
        try {
            // Get a CRN for the given course
            try {
                const data = await fs.readFile(path.join('data', course.split(/\s+/)[0] + '_parsed.json'), 'utf8');
                const jsonData = JSON.parse(data);
                resultCrn = findCrnForCode(jsonData, course);

            } catch (error) {
                console.error('Error reading or parsing JSON:', error.message);
            }
            newPrereqs = await callMicroservice(resultCrn, course_no_spaces);
            fileFound = true;
        } catch (error) {
            console.error("We couldn't fetch this course from the internet.", resultCrn)
        }
    }
    console.log("new prereqs:", newPrereqs);
    if (newPrereqs) {
        return newPrereqs;
    }
    return null;
}

async function getPrereqsFromList(courses) {
    const prereqs = [];
    for (const course of courses) {
        if (!Array.isArray(course.requirements)) {
            continue;
        }
        const flattenedRequirements = flattenArray(course.requirements);
        for (const requirement of flattenedRequirements) {
            newPrereq = await getPrereqs(requirement);
            prereqs.push(newPrereq);
        }
    }
    console.log(prereqs);
    return prereqs;
}

app.post('/getData', async (req, res) => {
    const major = req.body;

    try {
        if (!major.selectedMajor) {
            return res.status(400).send('missing major');
        }

        const majorData = JSON.parse(await fs.readFile(path.join('data', major.selectedMajor, 'reqs.json'), 'utf8'));

        const majorPrereqs = await getPrereqsFromList(majorData);
        console.log("major data", majorData);
        console.log("prereqs", majorPrereqs);

        if (!major.selectedOption) {
            return res.json([majorData, majorPrereqs]);
        }

        const optionData = JSON.parse(await fs.readFile(path.join('data', major.selectedMajor, major.selectedOption + '.json'), 'utf8'));
        const optionPrereqs = await getPrereqsFromList(optionData);

        return res.json([majorData, optionData, majorPrereqs, optionPrereqs]);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/getCourseData', async (req, res) => {
    const course = req.body;
    console.log("course", course);

    const prereqs = await getPrereqs(course.course);
    console.log(prereqs);

    if (prereqs === null) {
        // Send a 400 Bad Request response if prereqs is null
        res.status(400).json({ error: "Prerequisites not available for the specified course." });
    } else {
        // Send a 200 OK response with the prereqs value
        res.status(200).json({ prereqs: prereqs });
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
