export default class {
  constructor(params) {
    this.params = params;
  }

  setTitle(title) {
    document.title = title;
  }

  addStyle(fileName) {
    if (document.querySelector(`link[data-view-style="${fileName}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-view-style", fileName);
    link.href = `/assets/css/${fileName}.css`;

    document.head.appendChild(link);
  }

  removeStyles() {
    let links = document.querySelectorAll("link[data-view-style]");
    links?.forEach((link) => {
      link?.remove();
    });
  }

  async getHtml() {
    return "";
  }

  async init() {}
}
