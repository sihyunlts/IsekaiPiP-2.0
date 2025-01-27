const { ipcRenderer } = require("electron");
const Store = require("electron-store");
const store = new Store();

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

function docId(element) {
  return document.getElementById(element);
}

function docQuery(element) {
  return document.querySelector(element);
}

function beautyFollows(follows) {
  const first = `${(follows + "").substring(0, (follows + "").length - 4)}`;
  const second = `${(follows + "").substring(
    (follows + "").length - 4,
    (follows + "").length - 3,
  )}`;
  if (second * 1) return `${first}.${second}만명`;
  else return `${first}만명`;
}

if (params.platform === "darwin") {
  docQuery(".nav_mac").style.display = "flex";
} else {
  docQuery(".nav_window").style.display = "flex";
}

docQuery(".detail_background").addEventListener("click", (evt) => {
  if (evt.target.className === "detail_background") {
    docQuery(".detail_background").style.display = "none";
  }
});

docQuery(".header_refresh").addEventListener("click", () => {
  location.reload();
});

docQuery(".close").addEventListener("click", () => {
  ipcRenderer.send("closeMainWin", params.name);
});

docQuery(".minimize").addEventListener("click", () => {
  ipcRenderer.send("minimizeMainWin", params.name);
});

const container = docId("panel");
let tempArr = [];

store.get("pip_order").forEach((e, i) => {
  const div = document.createElement("div");
  div.id = e;
  div.className = "panel_item";
  div.draggable = true;
  let pipDelay = null;
  div.addEventListener("click", (evt) => {
    if (evt.target.className === "panel_item_more") return;
    if (!pipDelay) {
      ipcRenderer.send("openSelectPIP", e);
      pipDelay = setTimeout(() => {
        pipDelay = null;
      }, 5000);
    }
  });
  tempArr.push(div);
  if (!((i + 1) % 2)) {
    const panel_column = document.createElement("div");
    panel_column.className = "panel_column";
    tempArr.forEach((e) => {
      panel_column.append(e);
    });
    container.append(panel_column);
    tempArr = [];
  }
});

const user = ipcRenderer.sendSync("getUserProfile");
if (user.profile) {
  docQuery(".header_profile img").src = user.profile;
  docQuery(".username").href = `https://www.twitch.tv/${user.name}`;
  docQuery(".username p").innerText = user.name;
  docQuery(".user_sign").addEventListener("click", () => {
    ipcRenderer.send("logout");
  });
  docQuery(".user_sign p").innerText = "로그아웃";
} else {
  docQuery(".header_profile img").src = "../../assets/guest.svg";
  docQuery(".username p").innerText = "게스트";
  docQuery(".username img").src = "../../assets/question_mark.svg";
  docQuery(".user_sign").href = "https://www.twitch.tv/login";
  docQuery(".user_sign p").innerText = "로그인";
  docQuery(".user_sign img").src = "../../assets/login.svg";
}
const info = ipcRenderer.sendSync("getChannelInfo");

info.forEach((element, i) => {
  const panel_item = docId(element.name);
  const profile = document.createElement("div");
  profile.className = "panel_item_profile";
  if (element.isStream) profile.classList.add("is_stream");
  const profile_img = document.createElement("img");
  profile_img.src = element.profile;
  profile.append(profile_img);
  panel_item.append(profile);

  const panel_item_info = document.createElement("div");
  panel_item_info.className = "panel_item_info";

  const name = document.createElement("p");
  name.innerText = element.displayName;
  name.className = "panel_item_name";
  panel_item_info.append(name);

  const panel_item_stream_date = document.createElement("p");
  panel_item_stream_date.className = "panel_item_stream_date";
  const startDate = new Date(element.startDate);
  const nowDate = new Date();
  let diff = nowDate.getTime() - startDate.getTime();
  // get minutes between startDate and nowDate
  let diffTimes = Math.floor(diff / (1000 * 60));
  let diffTimeText = "";
  if (diffTimes >= 60 && element.isStream) {
    diffTimes = Math.floor(diffTimes / 60);
    diffTimeText = `${diffTimes}시간 전부터 방송 중!`;
    panel_item_stream_date.innerText = diffTimeText;
  } else if (element.isStream) {
    panel_item_stream_date.classList.add("is_stream");
    diffTimeText = `${diffTimes}분 전부터 방송 중!`;
    panel_item_stream_date.innerText = diffTimeText;
  } else {
    diff = nowDate.getTime() - new Date(element.lastStreamDate).getTime();
    diffTimes = Math.floor(diff / (1000 * 60));
    panel_item_stream_date.innerText = "최근 방송";
    const lastStreamDate = document.createElement("span");
    if (diffTimes >= 1440) {
      diffTimes = Math.floor(diffTimes / 60 / 24);
      diffTimeText = `${diffTimes}일 전`;
      lastStreamDate.innerText = diffTimeText;
    } else if (diffTimes >= 60) {
      diffTimes = Math.floor(diffTimes / 60);
      diffTimeText = `${diffTimes}시간 전`;
      lastStreamDate.innerText = diffTimeText;
    } else if (diffTimes < 60) {
      diffTimeText = `${diffTimes}분 전`;
      lastStreamDate.innerText = diffTimeText;
    }
    panel_item_stream_date.append(lastStreamDate);
  }
  if (element.isStream) panel_item_stream_date.classList.add("is_stream");
  panel_item_info.append(panel_item_stream_date);

  const follows = document.createElement("p");
  follows.className = "panel_item_follows";
  follows.innerText += "팔로워";
  const follows_span = document.createElement("span");
  follows_span.innerText = beautyFollows(element.follows);
  follows.append(follows_span);
  panel_item_info.append(follows);
  panel_item.append(panel_item_info);

  const more_img = document.createElement("img");
  more_img.src = "../../assets/more.svg";
  more_img.className = "panel_item_more";
  more_img.addEventListener("click", () => {
    // const detail = ipcRenderer.sendSync("getChannelInfoDetail", e);
    const detail_background = docQuery(".detail_background");
    detail_background.style.display = "block";
    if (element.isStream) {
      docQuery(
        ".detail_thumnail",
      ).src = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${element.name}-380x213.jpg`;
      docQuery(".detail_info_button p").innerText = diffTimeText;
    } else {
      docQuery(".detail_thumnail").src =
        "https://static-cdn.jtvnw.net/ttv-static/404_preview-380x213.jpg";
      docQuery(".detail_info_button p").innerText = "최근 방송 " + diffTimeText;
    }
    docQuery(".detail_info_name").innerText = element.displayName;
    docQuery(".detail_info_follows span").innerText = beautyFollows(
      element.follows,
    );
    docQuery(".detail_info_button").className = element.isStream
      ? "detail_info_button is_stream"
      : "detail_info_button is_not_stream";
    docId("detail_info_auto_toggle_checkbox").checked =
      store.get("auto_start")[element.name].enabled;
    docId("detail_info_auto_toggle_checkbox").addEventListener(
      "change",
      (evt) => {
        store.set(`auto_start.${element.name}.enabled`, evt.target.checked);
      },
    );
  });
  docId(element.name).append(more_img);
});

ipcRenderer.once("update_downloaded", () => {
  docQuery(".header_update").style.display = "flex";
  docQuery(".header_update").addEventListener("click", () => {
    ipcRenderer.send("restart_app");
  });
});

let columns = document.querySelectorAll(".panel_item");
let draggingClass = "dragging";
let dragSource;

Array.prototype.forEach.call(columns, (col) => {
  col.addEventListener("dragstart", handleDragStart, false);
  col.addEventListener("dragenter", handleDragEnter, false);
  col.addEventListener("dragover", handleDragOver, false);
  col.addEventListener("dragleave", handleDragLeave, false);
  col.addEventListener("drop", handleDrop, false);
  col.addEventListener("dragend", handleDragEnd, false);
});

function handleDragStart(evt) {
  dragSource = this;
  evt.target.classList.add(draggingClass);
  evt.dataTransfer.effectAllowed = "move";
  evt.dataTransfer.setData("text/html", this.innerHTML);
  evt.dataTransfer.setData("id", this.id);
}

function handleDragOver(evt) {
  evt.dataTransfer.dropEffect = "move";
  evt.preventDefault();
}

function handleDragEnter(evt) {
  this.classList.add("over");
}

function handleDragLeave(evt) {
  this.classList.remove("over");
}

function handleDrop(evt) {
  evt.stopPropagation();

  if (dragSource !== this) {
    dragSource.innerHTML = this.innerHTML;
    this.innerHTML = evt.dataTransfer.getData("text/html");
    dragSource.id = this.id;
    this.id = evt.dataTransfer.getData("id");
  }

  evt.preventDefault();
}

function handleDragEnd(evt) {
  Array.prototype.forEach.call(columns, function (col) {
    ["over", "dragging"].forEach(function (className) {
      col.classList.remove(className);
    });
  });
  store.set(
    "pip_order",
    Array.from(document.querySelectorAll(".panel_item")).map((e) => e.id),
  );
}
