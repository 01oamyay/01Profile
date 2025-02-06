import utils from "./utils/utils.js";
import NavBar from "./views/NavBar.js";
import Profile from "./views/Profile.js";
import SignIn from "./views/SignIn.js";

function navigate(url) {
  history.pushState(null, null, url);
  router();
}

async function router() {
  const pages = [
    {
      path: "/",
      view: Profile,
      style: "profile",
    },
    {
      path: "/sign-in",
      view: SignIn,
      style: "sign-in",
    },
  ];

  let page = pages.find((page) => window.location.pathname === page.path);
  if (!page) {
    utils.showError(404, "Page not found");
    return;
  }

  if (page.path == "/" && !utils.isLoggedIn()) {
    navigate("/sign-in");
    return;
  }

  if (page.path == "/sign-in" && utils.isLoggedIn()) {
    navigate("/");
    return;
  }

  let view = new page.view();

  view.removeStyles();
  view.addStyle(page.style);

  if (view instanceof Profile) {
    let navbarView = new NavBar();
    navbarView.addStyle("navbar");
    // document.querySelector("#headerContainer").innerHTML =
    //   await navbarView.getHtml();

    navbarView.init();
  } else {
    document.querySelector("#headerContainer").innerHTML = "";
  }

  let appContainer = document.getElementById("app");
  appContainer.innerHTML = await view.getHtml();
  view.init();
}

document.addEventListener("DOMContentLoaded", () => {
  router();
});

window.addEventListener("popstate", router);

export default { navigate };
