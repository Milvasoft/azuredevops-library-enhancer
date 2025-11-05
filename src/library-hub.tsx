import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { LibraryHub } from "./components/LibraryHub";

SDK.init();

SDK.ready().then(() => {
    ReactDOM.render(
        <LibraryHub />,
        document.getElementById("root")
    );
});
