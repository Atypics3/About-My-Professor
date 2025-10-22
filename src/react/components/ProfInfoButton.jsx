import React, { useState, useEffect } from "react";
import "../styles/index.css";
import Axios from "axios"; //for fetching from the API do npm install axios if this errors locally
import data from "../../data/prof_uids.json";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);
  //get full name from api
  const [fullName, getFullName] = useState("");

  //useEffect so this isn't run every time page reloads
  useEffect(() => {
    //get abreviated name from content.js
    let name = props.profName;
    //console.log(name);
    let uID = "jdoe";
    //console.log(data);
    //get uID by indexing the json data as a dictionary
    if (data[name]) {
      uID = data[name];
    } else {
      console.log(
        "couldn't match name to uID in the json, gave output",
        data[name],
      );
    }

    if (uID == "jdoe") {
      //if couldn't get uID set text to John Doe
      getFullName("John Doe");
    } else {
      //axios instead of fetch to get the full name from the api
      Axios.get("https://campusdirectory.ucsc.edu/api/uid/" + uID).then(
        (res) => {
          getFullName(res.data.cn[0]);
        },
      );
    }
  }, []);

  return (
    <div className="prof-info-container">
      {/* Button to toggle popup */}
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide Professor Info" : "Show Professor Info"}
      </button>

      {/* Popup content — only visible if `open` is true */}
      {open && (
        <div>
          <h3 style={{ marginTop: 0 }}>Professor Info</h3>
          <p>
            <strong>Name:</strong> {fullName}
          </p>
          <p>
            <strong>Department:</strong> Computer Science
          </p>
          <p>
            <strong>Email:</strong> johndoe@ucsc.edu
          </p>
          m{" "}
        </div>
      )}
    </div>
  );
}
