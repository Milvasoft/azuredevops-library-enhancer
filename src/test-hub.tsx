import * as React from "react";
import * as ReactDOM from "react-dom";
import { LibraryHubTest } from "./components/LibraryHubTest";

// Load data directly for testing
fetch('./test/test-data.json')
    .then(response => response.json())
    .then(data => {
        console.log('🗸 Loaded', data.value.length, 'variable groups');
        
        ReactDOM.render(
            <LibraryHubTest variableGroups={data.value} />,
            document.getElementById("root")
        );
    })
    .catch(error => {
        console.error('❌ Failed to load test data:', error);
        document.getElementById("root")!.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h3>Error loading test data</h3>
                <p>${error.message}</p>
            </div>
        `;
    });
