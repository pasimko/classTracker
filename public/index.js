// Possible bugs: option form doesn't clear on change of major??

// We probably want to fetch this from the server in the future
let majors = {
    "business": [
        "dean's academy",
        "digital marketing",
        "family business",
        "hospitality management",
        "innovation and entrepreneurship",
        "international business",
        "marketing",
        "merchandising management",
        "retail management",
        "sports business",
        "supply chain and logistics management",
    ],
    "computer science": [
        "artificial intelligence",
        "bioinformatics",
        "build your own",
        "business and entrepreneurship",
        "cybersecurity",
        "data science",
        "human-computer interaction",
        "robot intelligence",
        "simulation and game programming",
        "systems",
        "web and mobile application development",
    ],
    "electrical and computer engineering": null
}

const optionSelectDiv = document.getElementById("optionSelect");
const majorSelect = document.getElementById("majorSelect");
const goButton = document.getElementById("goButton");
const visualizeDiv = document.getElementById("visualize");

// Ensure form is reset on refresh
majorSelect.selectedIndex = 0;
goButton.disabled = true;
let selectedMajor = majorSelect.value;
let selectedOption = null

for (let major in majors) {
    const option = document.createElement('option');
    option.text = major;
    option.value = major;
    majorSelect.add(option);
}

majorSelect.addEventListener('change', () => {
    goButton.disabled = true;
    selectedMajor = majorSelect.value;
    selectedOption = null;
    while (optionSelectDiv.firstChild) {
        optionSelectDiv.removeChild(optionSelectDiv.firstChild);
    }
    if (majors[selectedMajor]) {
        const optionForm = document.createElement('select');
        const empty = document.createElement('option');
        empty.disabled = true
        empty.textContent = "select an option";
        empty.defaultSelected = true
        optionForm.appendChild(empty);

        majors[selectedMajor].forEach((optionValue) => {
            const optionElement = document.createElement('option');
            optionElement.value = optionValue;
            optionElement.textContent = optionValue;
            optionForm.appendChild(optionElement);
        });

        optionSelectDiv.appendChild(optionForm);
        optionForm.addEventListener('change', () => { 
            selectedOption = optionForm.value
            goButton.disabled = false
        })
    }
    else
        goButton.disabled = false;
});

async function requestData(major) {
    try {
        const response = await fetch('/getData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(major)
        });

        if (!response.ok) {
            throw new Error('Request failed.');
        }

        let result = await response.json();
        console.log('Received data:', result);
        return result
    } catch (error) {
        console.error('Error:', error.message);
    }
}

goButton.addEventListener('click', async () => {
    classData = await requestData({selectedMajor, selectedOption})
    console.log(classData)
    if (!classData || classData == undefined) {
        visualizeDiv.innerHTML = "! sorry, we don't have that data formatted yet."
        return
    }
    visualizeDiv.innerHTML = "";
    // Create the table element

    // Create the table element
    const courseTable = createTable(classData)
    // Append the table to the visualizeDiv
    visualizeDiv.appendChild(courseTable);
})

function createTableFromArrayOfObjectsWHEEEE(data) {
    const table = document.createElement('table');
    for (const obj of data) {
        columnForThisObject = document.createElement('th');
        columnForThisObject.text = obj.type;
        table.appendChild(columnForThisObject);
    }
    return table;
}
//
// Function to create an HTML table row for a list of items
function createTableRow(header, columns) {
    const label = document.createElement('tr');
    const labelCell = document.createElement('th');
    labelCell.innerText = header;
    label.appendChild(labelCell);
    for (const item of columns) {
        const cell = document.createElement('td');
        cell.textContent = item;
        label.appendChild(cell);
    }
    return label;
}

function createTable(data) {
    const table = document.createElement('table');

    for (const group of data) {
        for (const course of group) {
            const row = createTableRow(course.type, course.requirements);
            table.appendChild(row);

            if (course.electives) {
                const electivesRow = createTableRow(`${course.type} electives (${course.electiveCredits})`, course.electives);
                table.appendChild(electivesRow);
            }
        }
    }

    return table;
}
