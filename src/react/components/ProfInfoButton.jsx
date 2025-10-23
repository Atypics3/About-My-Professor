import React, { useState, useEffect } from "react";
import "../styles/index.css";
import default_pfp from "../../images/default_pfp.png"

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [open, setOpen] = useState(false);
  //get full name from api
  const [fullName, getFullName] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Function to handle image loading errors
  function handleImageError() {
    setImageError(true);
  };

  // Function to handle successful image load
  function handleImageLoad() {
    setImageLoaded(true);
    setImageError(false);
  };

  //useEffect so this isn't run every time page reloads
  useEffect(() => {
    //get fullname from content.js
    //console.log(props.apiData);
      const name = props.apiData.cn;
      
      setImageError(false); // Reset error state when new data comes in
      setImageLoaded(false); // Reset loaded state when new data comes in
      getFullName(name);
    },[])

  

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
          {!imageError ? (
            <img 
              class="prof-photo" 
              src={props.apiData.jpegphoto}
              onError={handleImageError}
              onLoad={handleImageLoad}
              alt="Professor photo"
            />
            ): 
            <img 
              class="prof-photo" 
              src={default_pfp}
              alt="Default profile picture"
            />
            }
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
