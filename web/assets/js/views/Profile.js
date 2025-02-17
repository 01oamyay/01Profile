import utils from "../utils/utils.js";
import View from "./View.js";

const query = `
{
  user {
    login
    firstName
    lastName
    auditRatio
    totalUp
    totalDown
    attrs
    topSkills: transactions(
      where: {type: {_like: "skill_%"}}
      distinct_on: [type]
      order_by: [{type: asc}, {amount: desc}]
    ) {
      id
      type
      amount
    }
  }
  xpProgress: transaction(
    where: {eventId: {_eq: 41}, type: {_eq: "xp"}}
    order_by: {createdAt: asc}
  ) {
    path
    eventId
    amount
    type
    object {
      type
      name
    }
    createdAt
  }
  totalXp: transaction_aggregate(where: {eventId: {_eq: 41}, type: {_eq: "xp"}}) {
    aggregate {
      sum {
        amount
      }
    }
  }
  projects: progress(
    where: {eventId: {_eq: 41}, object: {type: {_eq: "project"}}, grade: {_is_null: false}}
    order_by: {createdAt: desc},
    limit: 10
  ) {
    object {
      type
      name
    }
    grade
    createdAt
  }
  level: transaction(
    where: {eventId: {_eq: 41}, type: {_eq: "level"}}
    order_by: {createdAt: desc}
    limit: 1
  ) {
    amount
  }
}
`;

async function getData() {
  const response = await fetch(
    "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await response.json();
  if (data?.errors) {
    if (data?.errors[0]?.extensions?.code == "invalid-jwt") {
      utils.LogOut();
    } else {
      console.error(data.errors);
      // show an alert an then after user click ok refrech the page
      alert("Unexpected Error");
      window.location.reload();
    }
    return;
  }
  return data.data;
}

function getUserRole(userLevel) {
  let available = {
    0: "Aspiring developer",
    10: "Beginner developer",
    20: "Apprentice developer",
    30: "Assistant developer",
    40: "Basic developer",
    50: "Junior developer",
    55: "Confirmed developer",
    60: "Full-Stack developer",
  };

  let role = null;
  for (let level in available) {
    if (level <= userLevel) {
      role = available[level];
    } else {
      break;
    }
  }

  return role || "Unknown developer level";
}

export default class extends View {
  constructor(params) {
    super(params);
    this.setTitle("01 Profile");
    this.listeners = false;
  }

  addEventListener() {
    if (this.listeners) return;
    let logOutBtn = document.querySelector(".logout");
    logOutBtn?.addEventListener("click", () => {
      utils.LogOut();
    });
    this.listeners = true;
  }

  async getHtml() {
    return `
     <div class="container">
        <div class="general_info">
          <div class="head">
            <h1 class="title"><div class="vh"></div>Details Profile</h1>
            <button class="logout">logout</button>
          </div>
          <div class="content">
            <div class="top">
              <img class="pfp" src="/assets/holder.webp" alt="pfp">
              <div class="info">
                <h3 class="full-name"></h3>
                <div class="cards">
                  <div class="card">
                    <h2 class="card-title">Role</h2>
                    <p class="card-text role"></p>
                  </div>
                  <div class="card">
                    <h2 class="card-title">Phone Number</h2>
                    <p class="card-text phone-number"></p>
                  </div>
                  <div class="card">
                    <h2 class="card-title">Email</h2>
                    <p class="card-text email">davedomble@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="cards with-bg">
              <div class="card">
                <h2 class="card-title">Current Level</h2>
                <p class="card-text current-level"></p>
              </div>
              <div class="card">
                <h2 class="card-title">Experience Points</h2>
                <p class="card-text xp"></p>
              </div>
              <div class="card">
                <h2 class="card-title">Audit Ratio</h2>
                <p class="card-text ratio"></p>
              </div>
              <div class="card">
                <h2 class="card-title">Last Project</h2>
                <p class="card-text last-project"></p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <div class="container mt">
        <div class="general_info">
          <div class="head">
            <h1 class="title"><div class="vh"></div>Statistics</h1>
          </div>
          <div class="content mt">
            <div class="cards with-bg">
              <div class="card audit-graph">
                <h2 class="card-title">Audit Ratio</h2>
                
              </div>
              <div class="card skill-graph">
                <h2 class="card-title">Top Skills</h2>
                
              </div>
            </div>
          </div>
          <div class="content mt">
            <div class="cards with-bg">

              <div class="card xp-graph">
                <h2 class="card-title">XP Progression</h2>
                
              </div>
            </div>
            
          </div>
          <div class="content mt">
            <div class="cards with-bg">
              <div class="card stat-graph">
                <h2 class="card-title">Project Status</h2>
                
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }

  async init() {
    this.addEventListener();
    let data = await getData();
    if (!data) return;

    data.userRole = getUserRole(data?.level[0]?.amount);
    console.log(data);

    let pfp = document.querySelector(".pfp");
    pfp.src = getAvatar(data?.user[0]?.attrs?.gender, data?.user[0]?.login);

    let fullName = document.querySelector(".full-name");
    fullName.innerText = `${data?.user[0]?.firstName || ""} ${
      data?.user[0]?.lastName || ""
    }`;

    let role = document.querySelector(".role");
    role.innerText = data.userRole;

    let phoneNumber = document.querySelector(".phone-number");
    phoneNumber.innerText = data?.user[0]?.attrs.tel || "-";

    let emailAddress = document.querySelector(".email");
    emailAddress.innerText = data?.user[0]?.attrs.email || "-";

    let currentLevel = document.querySelector(".current-level");
    currentLevel.innerText = data?.level[0]?.amount || "-";

    let xp = document.querySelector(".xp");
    xp.innerText = bTokb(data?.totalXp?.aggregate?.sum?.amount) || "0B";

    let auditRatio = document.querySelector(".ratio");
    auditRatio.innerText = data?.user[0]?.auditRatio
      ? data?.user[0]?.auditRatio?.toFixed(1)
      : "0.0";

    let lastProject = document.querySelector(".last-project");
    lastProject.innerText =
      data?.xpProgress[data?.xpProgress?.length - 1]?.object?.name || "-";

    data.user[0].topSkills = data.user[0].topSkills
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // xp progress  graph
    createXpProg(data.xpProgress);
    createSkillsGraph(data.user[0].topSkills);

    let auditData = {
      totalUp: data.user[0].totalUp,
      totalDown: data.user[0].totalDown,
      auditRation: data.user[0].auditRatio,
    };
    createAuditGraph(auditData);
    createProjectStatusGraphWithDate(
      data.projects.map((p) => {
        return {
          name: p.object.name,
          grade: p.grade,
          createdAt: new Date(p.createdAt),
        };
      })
    );
  }
}

function getAvatar(gender, username) {
  return `https://avatar.iran.liara.run/public/${
    gender == "Male" ? "boy" : "girl"
  }?username=${username}`;
}

function createXpProg(data) {
  const sortedData = data.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  let cumulativeXP = 0;
  const dataPoints = sortedData.map((transaction) => {
    cumulativeXP += transaction.amount;
    return {
      date: new Date(transaction.createdAt),
      name: transaction.object.name,
      xp: cumulativeXP,
    };
  });

  const startDate = dataPoints[0].date;
  const endDate = dataPoints[dataPoints.length - 1].date;
  const maxXP = dataPoints[dataPoints.length - 1].xp;

  const width = 680;
  const height = 303;

  function scaleX(date) {
    const timeRange = endDate - startDate;
    const timePosition = date - startDate;
    return (timePosition / timeRange) * width;
  }

  function scaleY(xp) {
    return height - (xp / maxXP) * height;
  }

  const pathData = dataPoints
    .map((point, index) => {
      const x = scaleX(point.date);
      const y = scaleY(point.xp);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("height", "100%");
  svg.setAttribute("width", "100%");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("fill", "none");
  svg.setAttribute("style", "overflow: visible");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("stroke", "#b6b8ba");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "2");

  svg.appendChild(path);

  dataPoints.forEach((point) => {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    const x = scaleX(point.date);
    const y = scaleY(point.xp);

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", "#4ffdca");

    circle.addEventListener("mouseover", (e) => {
      circle.setAttribute("r", "6");
      const tooltip = document.createElement("div", "tooltip");
      tooltip.className = "tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.left = `${e.pageX + 30}px`;
      tooltip.style.top = `${e.pageY - 5}px`;
      tooltip.style.color = "white";
      tooltip.style.fontSize = "12px";

      tooltip.innerHTML = `
        Name: ${point.name}<br>
        Total XP: ${bTokb(point.xp)}
      `;

      document.body.appendChild(tooltip);
      circle.addEventListener("mouseout", () => {
        circle.setAttribute("r", "4");
        tooltip.remove();
      });
    });
    svg.appendChild(circle);
  });

  let xpDiv = document.querySelector(".xp-graph");
  if (xpDiv) {
    xpDiv.append(svg);
  }
}

function createSkillsGraph(topSkills) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 400 400`);
  svg.style.width = "100%";
  svg.style.height = "auto";

  // Configuration
  const width = 400; // Width of the SVG
  const height = 400; // Height of the SVG
  const centerX = width / 2; // Center X
  const centerY = height / 2; // Center Y
  const maxRadius = Math.min(width, height) / 2 - 30; // Radius of the radar chart
  const maxValue = Math.max(...topSkills.map((skill) => skill.amount)); // Maximum skill value

  // Normalize skill amounts to fit within the radar chart
  const normalizedSkills = topSkills.map((skill) => ({
    ...skill,
    normalizedAmount: (skill.amount / maxValue) * maxRadius,
  }));

  // Function to convert polar coordinates to Cartesian coordinates
  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  // Generate points for the radar chart
  const points = normalizedSkills.map((skill, index) => {
    const angle = (index / normalizedSkills.length) * 360;
    const point = polarToCartesian(
      centerX,
      centerY,
      skill.normalizedAmount,
      angle
    );
    return `${point.x},${point.y}`;
  });

  // Generate grid lines and labels
  const gridLines = [];
  const labelPoints = [];
  for (let i = 0; i < normalizedSkills.length; i++) {
    const angle = (i / normalizedSkills.length) * 360;
    const outerPoint = polarToCartesian(centerX, centerY, maxRadius, angle);
    const innerPoint = polarToCartesian(centerX, centerY, 0, angle);
    gridLines.push(
      `<line x1="${innerPoint.x}" y1="${innerPoint.y}" x2="${outerPoint.x}" y2="${outerPoint.y}" stroke="#ddd" />`
    );
    labelPoints.push(outerPoint);
  }

  // Add grid lines
  svg.innerHTML += gridLines.join("");

  // Add circular grid levels
  for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
    const circle = `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#ddd" />`;
    svg.innerHTML += circle;
  }

  // Add the polygon for the radar chart
  const polygon = `<polygon points="${points.join(
    " "
  )}" fill="rgba(79, 253, 202, 0.6)" stroke="#4ffdca" />`;
  svg.innerHTML += polygon;

  // Add labels for each skill
  normalizedSkills.forEach((skill, index) => {
    const angle = (index / normalizedSkills.length) * 360;
    const labelPoint = polarToCartesian(
      centerX,
      centerY,
      maxRadius + 20,
      angle
    );

    // Adjust text positioning for top and bottom labels
    const adjustedLabelPoint = {
      x: labelPoint.x,
      y: labelPoint.y,
    };

    if (angle > 270 || angle < 90) {
      // Top labels: Move slightly downward
      adjustedLabelPoint.y += 10;
    } else if (angle > 90 && angle < 270) {
      // Bottom labels: Move slightly upward
      adjustedLabelPoint.y -= 10;
    }

    const text = `<text x="${adjustedLabelPoint.x}" y="${
      adjustedLabelPoint.y
    }" text-anchor="middle" dominant-baseline="middle" font-size="18" fill="#fafafb">${skill.type.replace(
      "skill_",
      ""
    )}</text>`;
    svg.innerHTML += text;
  });

  // Append the SVG to the specified container
  const container = document.querySelector(".skill-graph");
  if (container) {
    container.appendChild(svg);
  }
}

function createAuditGraph(data) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.style.width = "100%";
  svg.style.height = "auto";

  const { totalUp, totalDown } = data;

  // Configuration
  const width = 400;
  const height = 400;
  const barWidth = 100;
  const barHeight = Math.min(totalUp, totalDown); // Use the smaller value as max height
  const scale = (height * 0.8) / barHeight; // Scale factor for bar height

  // Calculate heights
  const upHeight = totalUp * scale;
  const downHeight = totalDown * scale;

  // Draw 'totalUp' segment
  const upRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  upRect.setAttribute("x", (width - barWidth) / 2);
  upRect.setAttribute("y", height - upHeight);
  upRect.setAttribute("width", barWidth);
  upRect.setAttribute("height", upHeight);
  upRect.setAttribute("fill", "#4ffdca");
  svg.appendChild(upRect);

  // Draw 'totalDown' segment
  const downRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  downRect.setAttribute("x", (width - barWidth) / 2);
  downRect.setAttribute("y", height - (upHeight + downHeight));
  downRect.setAttribute("width", barWidth);
  downRect.setAttribute("height", downHeight);
  downRect.setAttribute("fill", "#ff0826");
  svg.appendChild(downRect);

  // Add labels
  const upLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  upLabel.setAttribute("x", (width - barWidth) / 2 + barWidth / 2);
  upLabel.setAttribute("y", height - upHeight / 2);
  upLabel.setAttribute("text-anchor", "middle");
  upLabel.setAttribute("font-size", "12");
  upLabel.textContent = `Up: ${bTokb(totalUp)}`;
  svg.appendChild(upLabel);

  const downLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  downLabel.setAttribute("x", (width - barWidth) / 2 + barWidth / 2);
  downLabel.setAttribute("y", height - (upHeight + downHeight / 2));
  downLabel.setAttribute("text-anchor", "middle");
  downLabel.setAttribute("font-size", "12");
  downLabel.textContent = `Down: ${totalDown}`;
  svg.appendChild(downLabel);

  // Append SVG to container
  const container = document.querySelector(".audit-graph");
  if (container) {
    container.appendChild(svg);
  }
}

function createProjectStatusGraphWithDate(projects, containerId) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const heightPerProject = 30;
  const totalHeight = projects.length * heightPerProject + 20;
  svg.setAttribute("viewBox", `0 0 700 ${totalHeight}`);
  svg.style.width = "100%";
  svg.style.height = "auto";

  // Configuration
  const width = 700; // Increased width to accommodate the date
  const barWidthScale = 0.6; // Scale factor for bar width
  const maxBarWidth = width * barWidthScale;

  // Helper function to determine bar color and status
  function getBarColorAndStatus(grade) {
    if (grade === null) {
      return { color: "#aaaaaa", status: "Ungraded" }; // Gray for ungraded
    } else if (grade >= 1) {
      return { color: "#08FFE1", status: "Pass", text: "#000", date: "#555" };
    } else {
      return {
        color: "#ff0826",
        status: "Fail",
        text: "white",
        date: "#a5a5a5",
      };
    }
  }

  // Helper function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  // Draw each project as a horizontal bar
  projects.forEach((project, index) => {
    const { name, grade, createdAt } = project;
    const { color, status, text, date } = getBarColorAndStatus(grade);

    // Calculate position and dimensions
    const y = index * heightPerProject + 10; // Vertical position
    const barWidth = grade !== null ? grade * maxBarWidth : 0; // Bar width based on grade

    // Draw the bar
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 10); // Horizontal offset
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", heightPerProject - 5);
    rect.setAttribute("fill", color);
    svg.appendChild(rect);

    // Add project name
    const nameText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    nameText.setAttribute("x", 10);
    nameText.setAttribute("y", y + heightPerProject / 2 + 3); // Centered vertically
    nameText.setAttribute("font-size", "12");
    nameText.setAttribute("fill", text);
    nameText.textContent = name;
    svg.appendChild(nameText);

    // Add creation date
    const dateText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    dateText.setAttribute("x", 200);
    dateText.setAttribute("y", y + heightPerProject / 2 + 3);
    dateText.setAttribute("font-size", "12");
    dateText.setAttribute("fill", date);
    dateText.textContent = `${formatDate(createdAt)}`;
    svg.appendChild(dateText);

    // Add status label
    const statusText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    statusText.setAttribute("x", width - 180);
    statusText.setAttribute("y", y + heightPerProject / 2 + 3);
    statusText.setAttribute("font-size", "12");
    statusText.setAttribute("fill", text);
    statusText.textContent = `${status} (${
      grade !== null ? grade.toFixed(2) : "N/A"
    })`;
    svg.appendChild(statusText);
  });

  // Append SVG to container
  const container = document.querySelector(".stat-graph");
  if (container) {
    container.appendChild(svg);
  }
}

function bTokb(b) {
  if (!b) return;
  return `${Math.floor(b / 1000)}kb`;
}
