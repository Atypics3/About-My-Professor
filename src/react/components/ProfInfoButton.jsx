import React, { useState } from "react";
import "../styles/index.css"; // optional, but useful if you want to add custom styles later

export default function ProfInfoButton() {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);

  return (
    <div className="prof-info-container" style={{ marginTop: "8px" }}>
      {/* Button to toggle popup */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 14px",
          borderRadius: "6px",
          border: "none",
          background: "#4f46e5",
          color: "#fff",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        {open ? "Hide Professor Info" : "Show Professor Info"}
      </button>

      {/* Popup content — only visible if `open` is true */}
      {open && (
        <div
          style={{
            marginTop: "10px",
            padding: "12px",
            width: "280px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#f9fafb",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Professor Info</h3>
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Department:</strong> Computer Science</p>
          <p><strong>Email:</strong> johndoe@ucsc.edu</p>

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #aaa",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
