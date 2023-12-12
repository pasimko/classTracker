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
const addClassInput = document.getElementById("addClassInput");
const addClassForm = document.getElementById("addClassForm");
const addClassButton = document.getElementById("addClassButton");
const visualizeDiv = document.getElementById("visualize");

// Ensure form is reset on refresh
majorSelect.selectedIndex = 0;
goButton.disabled = true;
let selectedMajor = majorSelect.value;
let selectedOption = null
let list_of_all_classes = [];
let all_cells_toggled_on = false;

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

function elementsNotInArray(array1, array2) {
  return array1.filter(element => !array2.includes(element)).length > 0;
}

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
        return result
    } catch (error) {
        console.error('Error:', error.message);
    }
}

goButton.addEventListener('click', async () => {
    classData = await requestData({selectedMajor, selectedOption})
    if (!classData || classData == undefined) {
        visualizeDiv.innerHTML = "! sorry, we don't have that data formatted yet."
        return
    }
    visualizeDiv.innerHTML = "";
    // Create the table element
    const courseTable = createTable(classData)
    // Append the table to the visualizeDiv
    visualizeDiv.appendChild(courseTable);
    // Add toggle button
    const toggle_button = document.createElement('button');
    toggle_button.onclick = () => toggleClass();
    toggle_button.innerText = "Toggle class taken status";
    visualizeDiv.appendChild(toggle_button);
    const toggle_info = document.createElement('p');
    toggle_info.innerText = "! Click this button to toggle all cells into on/off state"
    visualizeDiv.appendChild(toggle_info);
    addClassForm.hidden = false;
})

// Function to create an HTML table row for a list of items
function createTableRow(header, columns) {
    const label = document.createElement('tr');
    const labelCell = document.createElement('th');
    labelCell.innerText = header;
    label.appendChild(labelCell);
    for (const item of columns) {
        if (list_of_all_classes.indexOf(item) == -1) {
            list_of_all_classes.push(item);
            const cell = document.createElement('td');
            cell.onclick = function() {
                this.className = this.className == "grayed" ? "normal" : "grayed";
            }
            cell.textContent = item;
            cell.class = "normal";
            label.appendChild(cell);
        }
    }
    return label;
}

function createTable(data) {
    const table = document.createElement('table');

    // type: major, option, prerequisite
    for (const type of data) {
        if (type) {
            for (const course of type) {
                if (course && (course.requirements.length) > 0 && elementsNotInArray(course.requirements, list_of_all_classes)) {
                    if (course.type == 'prerequisites') {
                        const row = createTableRow(`${course.type} (${course.course})`, course.requirements);
                        table.appendChild(row);
                    }
                    else {
                        const row = createTableRow(course.type, course.requirements);
                        table.appendChild(row);

                        if (course.electives) {
                            const electivesRow = createTableRow(`${course.type} electives (${course.electiveCredits})`, course.electives);
                            table.appendChild(electivesRow);
                        }
                    }
                }
            }
        }
    }
    return table;
}

function toggleClass() {
    var tdElements = document.querySelectorAll('td');
    let newClass = all_cells_toggled_on ? "normal" : "grayed";
    for (var i = 0; i < tdElements.length; i++) {
        var td = tdElements[i];
        td.className = newClass;
    }
    all_cells_toggled_on = !all_cells_toggled_on;
}

async function requestCourseData(course) {
    try {
        const response = await fetch('/getCourseData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({course: course})
        });

        if (!response.ok) {
            throw new Error('Request failed.');
        }

        let result = await response.json();
        return result
    } catch (error) {
        console.error('Error:', error.message);
    }
}

addClassButton.addEventListener('click', async () => {
    classData = await requestCourseData(addClassInput.value);
    if (!classData || classData == undefined) {
        alert("We couldn't find that class");
        return;
    }
    const table = document.querySelector('table');
    // The structure of this object IS WRONG. WHY?!
    newRow = createTableRow(`${classData.prereqs.course}`, classData.prereqs.requirements);
    table.appendChild(newRow)
    console.log(classData);
})
