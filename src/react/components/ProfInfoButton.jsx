import React, { useState, useEffect } from "react";
import "../styles/index.css";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [isOpen, setIsOpen] = useState(false);
  //get full name from api
  const [fullName, getFullName] = useState("");
  const [isPhoto, seIsPhoto] = useState("");

  // handles photos that are valid and invalid - I.K
  function handlePhotoURL() {
    const photoURL = props.apiData.jpegphoto;
    if (photoURL && photoURL.includes("uid")) {
      seIsPhoto(photoURL);
    } else {
      seIsPhoto("");
    }
  }

  // handles opening and closing of pop up - I.K
  function handleOpen() {
    setIsOpen((prev) => !prev);
  }

  //useEffect so this isn't run every time page reloads
  useEffect(() => {
    //get fullname from content.js
    const name = props.apiData.cn;

    getFullName(name);
    handlePhotoURL();
  }, []);

  return (
    <div className="prof-info-container">
      {/* Button to toggle popup */}
      <button onClick={handleOpen}>
        {isOpen ? "Hide Professor Info" : "Show Professor Info"}
      </button>

      {/* Popup content — only visible if `open` is true */}
      {isOpen && (
        <div>
          <h3 style={{ marginTop: 0 }}>Professor Info</h3>
          {isPhoto ? (
            <img className="prof-photo" src={isPhoto} alt="Professor photo" />
          ) : (
            <img
              className="prof-photo"
              src={chrome.runtime.getURL("images/default_pfp.png")}
              alt="Default profile picture"
            />
          )}
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
