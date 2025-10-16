import React, { useState } from "react";
import "../styles/index.css"; 

export default function ProfInfoButton() {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);

  return (
    <div className="prof-info-container">
      {/* Button to toggle popup */}
      <button
        onClick={() => setOpen(!open)}
        
      >
        {open ? "Hide Professor Info" : "Show Professor Info"}
      </button>

      {/* Popup content — only visible if `open` is true */}
      {open && (
        <div
          
        >
          <h3 style={{ marginTop: 0 }}>Professor Info</h3>
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Department:</strong> Computer Science</p>
          <p><strong>Email:</strong> johndoe@ucsc.edu</p>
        </div>
      )}
    </div>
  );
}
