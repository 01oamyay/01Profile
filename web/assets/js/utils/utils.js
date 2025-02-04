import main from "../index.js";

function isLoggedIn() {
  return localStorage.getItem("jwt") !== null;
}

function showError(status, msg) {
  const app = document.querySelector("#app");

  const titles = {
    400: "400 Bad Request",
    401: "401 Unauthorized",
    404: "404 Not Found",
  };

  app.innerHTML = `
          <div class="errorDiv">
          <h1>${titles[status]}</h1><br>
          <h2>${msg || ""}</h2>
          </div>
      `;
}

function LogOut() {
  localStorage.removeItem("jwt");
  console.log("log out");
  main.navigate("/sign-in");
}

export default { isLoggedIn, showError, LogOut };
