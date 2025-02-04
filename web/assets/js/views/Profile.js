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
  if (data?.errors && data?.errors[0]?.extensions?.code == "invalid-jwt") {
    utils.LogOut();
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
  }

  async getHtml() {
    return `
     <div class="card">
  <h2>User Profile</h2>
  <div id="home" class="user-details">
    <p><strong>Full Name:</strong> <span class="full-name"></span></p>
    <p><strong>Role:</strong> <span class="role"></span></p>
    <p><strong>Phone Number:</strong> <span class="phone-number">(+212) 604121130</span></p>
    <p><strong>Email Address:</strong> <span class="email">oamyay@proton.me</span></p>
    <p><strong>Current Level:</strong> <span class="current-level"></span></p>
    <p><strong>Experience Points:</strong> <span class="xp"></span></p>
    <p><strong>Audit Ratio:</strong> <span class="ratio"></span></p>
    <p><strong>Last Project:</strong> <span class="last-project"></span></p>
  </div>
</div>

<div id="skills" class="graph-container">
  <h3 class="graph-title">Top Skills</h3>
  <div class="skill-graph"></div>
</div>

<div class="graph-container">
  <h3 class="graph-title">XP Progression</h3>
  <div class="xp-graph"></div>
</div>

<div class="graph-container">
  <h3 class="graph-title">Audit Ratio</h3>
  <div class="audit-graph"></div>
</div>

<div class="graph-container">
  <h3 class="graph-title">Project Status</h3>
  <div class="stat-graph"></div>
</div>
    `;
  }

  async init() {
    let data = await getData();
    if (!data) return;

    data.userRole = getUserRole(data?.level[0]?.amount);
    console.log(data);

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

function createXpProg(progress) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const width = 800;
  const height = 400;

  // Calculate data points
  let accXP = 0;
  const dataPoints = progress.map((prog) => {
    accXP += prog.amount || 0;
    return {
      date: new Date(prog.createdAt),
      name: prog.object.name,
      xp: accXP,
    };
  });

  // Define scales
  const startDate = dataPoints[0].date;
  const endDate = dataPoints[dataPoints.length - 1].date;
  const maxXP = dataPoints[dataPoints.length - 1].xp;

  const sx = (date) => ((date - startDate) / (endDate - startDate)) * width;
  const sy = (xp) => height - (xp / maxXP) * height;

  // Create path
  const pathData = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.date)} ${sy(p.xp)}`)
    .join(" ");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("stroke", "#9c27b0");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", "2");

  // Add circles and tooltips
  dataPoints.forEach((point) => {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", sx(point.date));
    circle.setAttribute("cy", sy(point.xp));
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", "#9c27b0");

    circle.addEventListener("mouseover", () => {
      circle.setAttribute("r", "6");
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.style.left = `${sx(point.date) + 10}px`;
      tooltip.style.top = `${sy(point.xp) - 20}px`;
      tooltip.textContent = `Name: ${point.name}\nTotal XP: ${Math.round(
        point.xp
      )}`;
      document.body.appendChild(tooltip);
    });

    circle.addEventListener("mouseout", () => {
      circle.setAttribute("r", "4");
      document.querySelector(".tooltip")?.remove();
    });

    svg.appendChild(circle);
  });

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  document.querySelector(".xp-graph").appendChild(svg);
}

function createSkillsGraph(topSkills) {
  // Configuration
  const width = 500; // Width of the SVG
  const height = 500; // Height of the SVG
  const centerX = width / 2; // Center X
  const centerY = height / 2; // Center Y
  const maxRadius = Math.min(width, height) / 2 - 20; // Radius of the radar chart
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

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

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
  )}" fill="rgba(0, 128, 255, 0.3)" stroke="#007bff" />`;
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
    const text = `<text x="${labelPoint.x}" y="${
      labelPoint.y
    }" text-anchor="middle" dominant-baseline="middle" font-size="12">${skill.type.replace(
      "skill_",
      ""
    )}</text>`;
    svg.innerHTML += text;
  });

  // Append the SVG to the specified container
  const container = document.querySelector(".skill-graph");
  if (container) {
    container.innerHTML = ""; // Clear previous content
    container.appendChild(svg);
  }
}

function createAuditGraph(data) {
  const { totalUp, totalDown, auditRatio } = data;

  // Configuration
  const width = 300;
  const height = 150;
  const barWidth = 50;
  const barHeight = Math.min(totalUp, totalDown); // Use the smaller value as max height
  const scale = (height * 0.8) / barHeight; // Scale factor for bar height

  // Create SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Calculate heights
  const upHeight = totalUp * scale;
  const downHeight = totalDown * scale;

  // Draw 'totalUp' segment
  const upRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  upRect.setAttribute("x", (width - barWidth) / 2);
  upRect.setAttribute("y", height - upHeight);
  upRect.setAttribute("width", barWidth);
  upRect.setAttribute("height", upHeight);
  upRect.setAttribute("fill", "#4caf50"); // Green for 'up'
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
  downRect.setAttribute("fill", "#f44336"); // Red for 'down'
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
  upLabel.textContent = `Up: ${totalUp}`;
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
    container.innerHTML = ""; // Clear previous content
    container.appendChild(svg);
  }
}

function createProjectStatusGraphWithDate(projects, containerId) {
  // Configuration
  const width = 700; // Increased width to accommodate the date
  const heightPerProject = 30; // Height for each project row
  const totalHeight = projects.length * heightPerProject + 20; // Total height of the chart
  const barWidthScale = 0.6; // Scale factor for bar width
  const maxBarWidth = width * barWidthScale;

  // Create SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", totalHeight);

  // Helper function to determine bar color and status
  function getBarColorAndStatus(grade) {
    if (grade === null) {
      return { color: "#aaaaaa", status: "Ungraded" }; // Gray for ungraded
    } else if (grade >= 1) {
      return { color: "#4caf50", status: "Pass" }; // Green for pass
    } else {
      return { color: "#f44336", status: "Fail" }; // Red for fail
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
    const { color, status } = getBarColorAndStatus(grade);

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
    nameText.setAttribute("fill", "#000");
    nameText.textContent = name;
    svg.appendChild(nameText);

    // Add creation date
    const dateText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    dateText.setAttribute("x", 180); // Offset for the date
    dateText.setAttribute("y", y + heightPerProject / 2 + 3); // Centered vertically
    dateText.setAttribute("font-size", "12");
    dateText.setAttribute("fill", "#555");
    dateText.textContent = `${formatDate(createdAt)}`;
    svg.appendChild(dateText);

    // Add status label
    const statusText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    statusText.setAttribute("x", width - 180); // Right-aligned
    statusText.setAttribute("y", y + heightPerProject / 2 + 3); // Centered vertically
    statusText.setAttribute("font-size", "12");
    statusText.setAttribute("fill", "#000");
    statusText.textContent = `${status} (${
      grade !== null ? grade.toFixed(2) : "N/A"
    })`;
    svg.appendChild(statusText);
  });

  // Append SVG to container
  const container = document.querySelector(".stat-graph");
  if (container) {
    container.innerHTML = ""; // Clear previous content
    container.appendChild(svg);
  }
}

function bTokb(b) {
  if (!b) return;
  return `${Math.floor(b / 1000)}kb`;
}
