import React, { useState, useEffect, useCallback } from "react";
import "../styles/index.css";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [isOpen, setIsOpen] = useState(false);
  const [isPhoto, setIsPhoto] = useState("");
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // rate my professor data - I.K
  const rateMyProfessor = props.rateMyProfessor;
  const rating = rateMyProfessor?.avgRatingRounded;
  const numRatings = rateMyProfessor?.numRatings;
  const wouldTakeAgain = rateMyProfessor?.wouldTakeAgainPercentRounded;
  const avgDifficulty = rateMyProfessor?.avgDifficultyRounded;
  const legacyId = rateMyProfessor?.legacyId;
  const profileUrl = legacyId
    ? `https://www.ratemyprofessors.com/professor/${legacyId}`
    : null;
  const ratingTags = Array.isArray(rateMyProfessor?.teacherRatingTags)
    ? rateMyProfessor.teacherRatingTags.filter((tag) => tag?.tagName)
    : [];
  const topTags = ratingTags.slice(0, 4);

  const toNumber = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(num) ? num : null;
  };

  const roundToWhole = (value) => {
    const num = toNumber(value);
    return num != null ? Math.round(num) : null;
  };

  const roundToOneDecimal = (value) => {
    const num = toNumber(value);
    return num != null ? Math.round(num * 10) / 10 : null;
  }
  
  const roundedRating = roundToWhole(rating);

  // covers case where additional decimals aren't truncated appropriately (e.g. 3.8000...)
  const roundedDifficulty = roundToOneDecimal(avgDifficulty);

  const roundedWouldTakeAgain = roundToWhole(wouldTakeAgain);

  // Helper to get the first trimmed item from a string or array, or null  - E.H
  const getFirst = (value) => {
    if (Array.isArray(value) && value.length > 0) {
      return value[0].trim() || null;
    }
    if (typeof value === 'string') {
      return value.trim() || null;
    }
    return null;
  };


  const name = getFirst(props.apiData?.cn) || "Not Listed";
  const email = getFirst(props.apiData?.mail);
  const phone = getFirst(props.apiData?.telephonenumber) || "Not Listed";
  const department = getFirst(props.apiData?.ucscpersonpubdepartmentnumber);
  const divisionValue = getFirst(props.apiData?.ucscpersonpubdivision);
  const officeHours = getFirst(props.apiData?.ucscpersonpubofficehours);
  const researchInterest = getFirst(props.apiData?.ucscpersonpubresearchinterest);    // assumes this is not an array/string to be trimmed
  const courses = props.apiData?.ucscpersonpubfacultycourses;                         // assumes this is already an array

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const showDivision =
    divisionValue && department && normalize(divisionValue) !== normalize(department);

  const detailItems = [
    email && { label: "Email", value: email, href: `mailto:${email}` },
    phone && { label: "Phone", value: phone, href: `tel:${phone}` },
  ].filter(Boolean);

  // check if any of the "more info" fields actually have content or not - E.H
  // the field either has to have a valid type or null
  const hasMoreInfo = Boolean(officeHours) ||
    (Array.isArray(courses) && courses.length > 0) ||
    Boolean(researchInterest);

  // handles photos that are valid and invalid - I.K
  // using useCallBack for more efficient rendering (it memoizes handlePhotoURL)
  // https://stackoverflow.com/questions/71265042/what-is-usecallback-in-react-and-when-to-use-it  - E.H
  const handlePhotoURL = useCallback(() => {
    if (props.apiData) {
      const photoURL = props.apiData.jpegphoto;
      if (photoURL && photoURL.includes("uid")) {
        setIsPhoto(photoURL);
      } else {
        setIsPhoto("");
      }
    } else {
      setIsPhoto("");
    }
  }, [props.apiData]); // This function now only changes if apiData changes

  // handles opening and closing of pop up - I.K
  function handleOpen() {
    setIsOpen((prev) => !prev);

    // reset the "more info" button section when closing the main popup  - E.H
    if (isOpen) {
      setShowMoreInfo(false);
    }
  }

  // --- Handler for the "More Info" button ---
  function handleToggleMoreInfo(e) {
    // Stop the click from closing the whole modal
    // if the button is ever inside the click overlay
    e.stopPropagation(); 
    setShowMoreInfo((prev) => !prev);
  }

  // This effect handles the photo loading  - E.H
  useEffect(() => {
    // only need to run photo logic when the popup opens and we have data
    if (isOpen) {
      handlePhotoURL();
    }
  }, [isOpen, handlePhotoURL]); 

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
      setShowMoreInfo(false); // also reset on overlay click
    }
  }

  // This component won't render anything if it doesn't get apiData
  if (!props.apiData) {
    return null;
  }

  return (
    <div className="prof-info-container">
      {/* Button to toggle popup */}
      <button className="prof-info-btn" onClick={handleOpen}>
        {isOpen ? "Hide Professor Info" : "Show Professor Info"}
      </button>

      {/* Popup content — only visible if `open` is true */}
      {isOpen && (
        <div className="prof-info-modal-overlay" onClick={handleOverlayClick}>
          <div className="prof-info-modal" role="dialog" aria-modal="true">
            <div className="prof-info-header">
              <h3 className="prof-info-title">Professor Info</h3>
              <button className="prof-info-close" onClick={handleOpen}>
                Close
              </button>
            </div>

            {/* AMP section */}
            <div className="campus-card">
              <div className="campus-card-header">
                <h4>Campus Directory</h4>
              </div>
              <div className="campus-card-hero">
                {isPhoto ? (
                  <img className="prof-photo" src={isPhoto} alt="Professor photo" />
                ) : (
                  <img
                    className="prof-photo"
                    src={chrome.runtime.getURL("images/default_pfp.png")}
                    alt="Default profile picture"
                  />
                )}
                <div className="campus-card-hero-text">
                  <h5>{name}</h5>
                  <div className="campus-chip-row">
                    {department && <span className="campus-chip">{department}</span>}
                    {showDivision && (
                      <span className="campus-chip subtle">{divisionValue}</span>
                    )}
                  </div>
                </div>
              </div>
              {detailItems.length > 0 && (
                <div className="campus-card-grid">
                  {detailItems.map((item) => (
                    <div className="campus-detail" key={item.label}>
                      <span className="detail-label">{item.label}</span>
                      {item.href ? (
                        <a className="detail-value" href={item.href}>
                          {item.value}
                        </a>
                      ) : (
                        <span className="detail-value">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* This button will only show if there is info to hide */}
              {hasMoreInfo && (
                <button className="prof-info-more-btn" onClick={handleToggleMoreInfo}>
                  {showMoreInfo ? "Show Less" : "More Info"}
                </button>
              )}


              {/* --- Collapsible (More Info) Section --- */}
              {showMoreInfo && (
                <div className="prof-info-more-section">
                  {/* Office Hours */}
                  {officeHours && (
                     <div className="campus-card-section">
                        <p><strong>Office Hours:</strong> {officeHours}</p>
                     </div>
                  )}

                  {/* Courses Taught */}
                  {Array.isArray(courses) && courses.length > 0 && (
                    <div className="campus-card-section">
                      <h6>Courses Taught</h6>
                      <ul>
                        {courses.map((course, i) => (
                          <li key={i}>{course}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Research Interest */}
                   {(() => {
                      if (typeof researchInterest === "string" && researchInterest.trim()) {
                        const rInterestHTML =
                          "<p><strong>Research Interests: </strong>" + researchInterest + "</p>";
                        return (
                          <div
                            className="campus-card-section"
                            dangerouslySetInnerHTML={{ __html: rInterestHTML }}
                          />
                        );
                      }
                    })()}
                </div>
              )}
            </div>

            {/* RMP section */}
            <div className="rmp-section">
              {rateMyProfessor ? (
                <div className="rmp-card">
                  <div className="rmp-card-header">
                    <h4>Rate My Professors</h4>
                    {profileUrl && (
                      <a href={profileUrl} target="_blank" rel="noreferrer">
                        View Profile
                      </a>
                    )}
                  </div>
                  <div className="rmp-card-grid">
                    <div className="rmp-metric rating">
                      <span className="metric-label">Rating</span>
                      <span className="metric-value">
                        {roundedRating != null ? `${roundedRating}/5` : "N/A"}
                      </span>
                      <span className="metric-sub">Average score</span>
                    </div>
                    <div className="rmp-metric difficulty">
                      <span className="metric-label">Difficulty</span>
                      <span className="metric-value">
                        {roundedDifficulty != null ? `${roundedDifficulty}/5` : "N/A"}
                      </span>
                      <span className="metric-sub">Avg difficulty</span>
                    </div>
                    <div className="rmp-metric would-take">
                      <span className="metric-label">Would Take Again</span>
                      <span className="metric-value">
                          {roundedWouldTakeAgain != null && numRatings > 0
                          ? `${roundedWouldTakeAgain}%`
                          : "N/A"}
                      </span>
                      <span className="metric-sub">Student approval</span>
                    </div>
                    <div className="rmp-metric total-ratings">
                      <span className="metric-label">Ratings</span>
                      <span className="metric-value">
                        {roundedWouldTakeAgain != null ? numRatings : "N/A"}
                      </span>
                      <span className="metric-sub">Total reviews</span>
                    </div>
                  </div>
                  {topTags.length > 0 && (
                    <div className="rmp-tags">
                      <span className="tags-label">Top Tags</span>
                      <div className="tags-grid">
                        {topTags.map((tag) => (
                          <span className="tag-chip" key={tag.id || tag.legacyId}>
                            <span className="tag-name">{tag.tagName}</span>
                            <span className="tag-count">{tag.tagCount}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rmp-card empty">
                  <div className="rmp-card-header">
                    <h4>Rate My Professors</h4>
                  </div>
                  <p className="rmp-empty">Rate My Professors data not available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}