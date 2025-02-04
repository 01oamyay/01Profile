import utils from "../utils/utils.js";
import View from "./View.js";

export default class extends View {
  constructor(params) {
    super(params);
  }

  async getHtml() {
    return `
    <div class="logo"><span>01</span>Profile</div>
    <div>
        <button class="btn logout">Log out</button>
    </div>
    `;
  }

  async init() {
    const logoutButton = document.querySelector(".logout");
    logoutButton?.addEventListener("click", async () => {
      utils.LogOut();
    });
  }
}
