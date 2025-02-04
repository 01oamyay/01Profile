import View from "./View.js";
import main from "../index.js";

async function login(user) {
  let auth = btoa(`${user.username}:${user.password}`);
  const response = await fetch("https://learn.zone01oujda.ma/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await response.json();

  if (response.ok) {
    return data;
  } else {
    throw new Error(data.error);
  }
}

export default class extends View {
  constructor(params) {
    super(params);
    this.setTitle("Sign In");
  }

  async getHtml() {
    return `
        <div class="login-container">
            <h1>Login To Your Profile</h1>
            <form id="form-login">
                <input
                    type="text"
                    id="username"
                    placeholder="Username or Email"
                    required
                />
                <p id="username-error" class="error"></p>
                <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    required
                />
                <p id="password-error" class="error"></p>
                <button id="login-btn" type="submit" >Login</button>
            </form>
            <p class="error" id="login-error"></p>
        </div>
    `;
  }

  async init() {
    const form = document.getElementById("form-login");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username")?.value;
      const password = document.getElementById("password")?.value;

      let usernameError = document.getElementById("username-error");
      let passwordError = document.getElementById("password-error");
      let loginError = document.getElementById("login-error");
      let loginBtn = document.getElementById("login-btn");

      // validate username & password
      if (!username) {
        usernameError.textContent = "Username is required";
        return;
      }
      if (!password) {
        passwordError.textContent = "Password is required";
        return;
      }

      try {
        const token = await login({ username, password });
        localStorage.setItem("jwt", token);
        main.navigate("/");
      } catch (e) {
        loginError.textContent = e.message;
      }
    });
  }
}
