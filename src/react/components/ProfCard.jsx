/*
import React from "react";
import "../styles/index.css";

function ProfCard() {
  return <div className="prof-card">Hello World</div>;
}

export default ProfCard;
*/

import React, { useState } from "react";
import "../styles/index.css";

export default function ProfInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="prof-info-container" style={{ marginTop: "8px" }}>
      {/* ✅ Button styled to match UCSC blue text/link color */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 14px",
          borderRadius: "6px",
          border: "1px solid #0055A2",
          background: "#0055A2", // UCSC blue
          color: "#fff",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.background = "#004080")}
        onMouseLeave={(e) => (e.target.style.background = "#0055A2")}
      >
        {open ? "Hide Professor Info" : "Show Professor Info"}
      </button>

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
          <h3 style={{ marginTop: 0, color: "#0055A2" }}>Professor Info</h3>
          <p>
            <strong>Name:</strong> John Doe
          </p>
          <p>
            <strong>Department:</strong> Computer Science
          </p>
          <p>
            <strong>Email:</strong> johndoe@ucsc.edu
          </p>

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #0055A2",
              background: "#fff",
              color: "#0055A2",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
