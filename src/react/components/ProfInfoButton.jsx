import React, { useState, useEffect } from "react";
import "../styles/index.css";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [isOpen, setIsOpen] = useState(false);
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
    //get fullname from content.js - B.C.
    console.log(props.apiData);
    if (props.apiData != null) {
      let name = props.apiData.cn;
      getFullName(name);
    } else {
      getFullName("John Doe");
    }
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
          {/*gets email and phone number from API if exists or "Not Listed" - B.C. */}
          <p>
            <strong>Email:</strong> {props.apiData?.mail || "Not listed"}
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            {props.apiData?.telephonenumber || "Not listed"}
          </p>
          {/* code to get div and display if different from department */}
          {(() => {
            const department =
              props.apiData?.ucscpersonpubdepartmentnumber || "Not Listed";
            const divisionArray = props.apiData?.ucscpersonpubdivision || [];
            const division = Array.isArray(divisionArray)
              ? divisionArray[0]
              : divisionArray;

            //normalize both before comparing
            const norm = (s) =>
              String(s || "")
                .trim()
                .toLowerCase();
            const showDivision =
              division && department && norm(division) !== norm(department);

            return (
              showDivision && (
                <p>
                  <strong>Division:</strong> {division}
                </p>
              )
            );
          })()}
          <p>
            {/* gets department from API if it exists or "Not Listed" - E.H */}
            <strong>Department:</strong>{" "}
            {props.apiData?.ucscpersonpubdepartmentnumber || "Not Listed"}
          </p>
          {/* gets office hours from API if it exists or "Not Listed" - E.H */}
          <p>
            <strong>Office Hours:</strong>{" "}
            {props.apiData?.ucscpersonpubofficehours || "Not listed"}
          </p>
          {/* code to display courses taught by professor */}
          {(() => {
            const courses = props.apiData?.ucscpersonpubfacultycourses;

            if (Array.isArray(courses) && courses.length > 0) {
              return (
                <div>
                  <p>
                    <strong>Courses Taught:</strong>
                  </p>
                  <ul>
                    {courses.map((course, i) => (
                      <li key={i}>{course}</li>
                    ))}
                  </ul>
                </div>
              );
            } else {
              return (
                <p>
                  <strong>Courses Taught:</strong> Not listed
                </p>
              );
            }
          })()}
          {/*code to display posted research Interests - B.C.*/}
          {(() => {
            const researchInterest =
              props.apiData?.ucscpersonpubresearchinterest || "Not listed";
            if (researchInterest != "Not listed") {
              const rInterestHTML =
                "<strong>Research Interests:</strong>" + researchInterest;
              return (
                <div dangerouslySetInnerHTML={{ __html: rInterestHTML }} />
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
