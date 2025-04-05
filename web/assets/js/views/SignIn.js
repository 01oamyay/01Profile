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
        <div class="form-container">
          <p class="title">Login To Your Account</p>
          <form class="form" id="form-login">
            <div class="input-group">
              <label for="username">Username</label>
              <input type="text" name="username" id="username" placeholder="">
              <p class="error" id="username-error"></p>
            </div>
            <div class="input-group">
              <label for="password">Password</label>
              <input type="password" name="password" id="password" placeholder="">
              <p class="error" id="password-error"></p>
            </div>
            <button type="submit" class="sign">Sign in</button>
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

      // validate username & password
      if (!username) {
        usernameError.textContent = "Username is required";
        return;
      } else {
        usernameError.textContent = "";
      }
      if (!password) {
        passwordError.textContent = "Password is required";
        return;
      } else {
        passwordError.textContent = "";
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
