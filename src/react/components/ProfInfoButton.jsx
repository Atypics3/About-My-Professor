import React, { useState, useEffect } from "react";
import "../styles/index.css";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);
  //get full name from api
  const [fullName, getFullName] = useState("");

  //useEffect so this isn't run every time page reloads
  useEffect(() => {
    //get fullname from content.js
    console.log(props.apiData);
    if (props.apiData != null) {
      let name = props.apiData.cn;
      //console.log(name);
      getFullName(name);
    } else {
      getFullName("John Doe");
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
          </p>{" "}
        </div>
      )}
    </div>
  );
}
