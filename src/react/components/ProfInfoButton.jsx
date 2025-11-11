import React, { useState, useEffect } from "react";
import "../styles/index.css";

export default function ProfInfoButton(props) {
  // Track whether popup is open or closed
  const [isOpen, setIsOpen] = useState(false);
  const [isPhoto, seIsPhoto] = useState("");

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
  const roundedRating = roundToWhole(rating);
  const roundedWouldTakeAgain = roundToWhole(wouldTakeAgain);
  const name = props.apiData?.cn ?? "Not listed";
  const email =
    typeof props.apiData?.mail === "string" && props.apiData.mail.trim()
      ? props.apiData.mail.trim()
      : null;
  const phone =
    typeof props.apiData?.telephonenumber === "string" &&
    props.apiData.telephonenumber.trim()
      ? props.apiData.telephonenumber.trim()
      : null;
  const departmentRaw =
    typeof props.apiData?.ucscpersonpubdepartmentnumber === "string"
      ? props.apiData.ucscpersonpubdepartmentnumber.trim()
      : "";
  const department = departmentRaw || null;
  const divisionArray = props.apiData?.ucscpersonpubdivision || [];
  const divisionValue = (() => {
    const raw = Array.isArray(divisionArray) ? divisionArray[0] : divisionArray;
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim();
    }
    return null;
  })();
  const officeHours =
    typeof props.apiData?.ucscpersonpubofficehours === "string" &&
    props.apiData.ucscpersonpubofficehours.trim()
      ? props.apiData.ucscpersonpubofficehours.trim()
      : null;
  const courses = props.apiData?.ucscpersonpubfacultycourses;
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const showDivision =
    divisionValue && department && normalize(divisionValue) !== normalize(department);
  const detailItems = [
    email && { label: "Email", value: email, href: `mailto:${email}` },
    phone && { label: "Phone", value: phone, href: `tel:${phone}` },
    officeHours && { label: "Office Hours", value: officeHours },
  ].filter(Boolean);

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

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      handlePhotoURL();
    }
  }, [isOpen, props.apiData]);

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
              {(() => {
                const researchInterest = props.apiData?.ucscpersonpubresearchinterest;
                if (typeof researchInterest === "string" && researchInterest.trim()) {
                  const rInterestHTML =
                    "<p><strong>Research Interests:</strong>" + researchInterest + "</p>";
                  return (
                    <div
                      className="campus-card-section"
                      dangerouslySetInnerHTML={{ __html: rInterestHTML }}
                    />
                  );
                }
              })()}
            </div>

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
                        {avgDifficulty != null ? `${avgDifficulty}/5` : "N/A"}
                      </span>
                      <span className="metric-sub">Avg difficulty</span>
                    </div>
                    <div className="rmp-metric would-take">
                      <span className="metric-label">Would Take Again</span>
                      <span className="metric-value">
                        {roundedWouldTakeAgain != null
                          ? `${roundedWouldTakeAgain}%`
                          : "N/A"}
                      </span>
                      <span className="metric-sub">Student approval</span>
                    </div>
                    <div className="rmp-metric total-ratings">
                      <span className="metric-label">Ratings</span>
                      <span className="metric-value">
                        {numRatings != null ? numRatings : "N/A"}
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
