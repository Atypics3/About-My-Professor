import React, { useState, useEffect } from "react";
import "../styles/index.css";
import Axios from "axios"; //for fetching from the API do npm install axios if this errors locally

export default function ProfInfoButton() {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);
  //get full name from api
  const [fullName, getFullName] = useState("");

  //useEffect so this isn't run every time page reloads
  useEffect(() => {
    let uid = "ptantalo";
    //axios instead of fetch to get the full name from the api
    Axios.get("https://campusdirectory.ucsc.edu/api/uid/" + uid).then((res) => {
      getFullName(res.data.cn[0]);
    });
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
        </div>
      )}
    </div>
  );
}
