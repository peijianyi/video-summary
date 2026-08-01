const tabs = document.querySelectorAll("[data-tab]");
const panels = document.querySelectorAll("[data-panel]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((item) => {
      item.classList.toggle("is-active", item === tab);
      item.setAttribute("aria-selected", String(item === tab));
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === target);
    });
  });
});

const noteForm = document.getElementById("noteForm");
const noteDate = document.getElementById("noteDate");
const noteText = document.getElementById("noteText");
const noteStatus = document.getElementById("noteStatus");
const submitButton = noteForm?.querySelector("button[type='submit']");
const notesEndpoint = window.PPFORV_NOTES_API || "/api/notes";

if (noteDate && !noteDate.value) {
  noteDate.value = new Date().toISOString().slice(0, 10);
}

function setNoteStatus(message, type) {
  if (!noteStatus) {
    return;
  }

  noteStatus.textContent = message;
  noteStatus.classList.toggle("is-success", type === "success");
  noteStatus.classList.toggle("is-error", type === "error");
}

noteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = noteDate.value;
  const text = noteText.value.trim();

  if (!data || !text) {
    setNoteStatus("请先填写日期和备注。", "error");
    return;
  }

  submitButton.disabled = true;
  setNoteStatus("正在提交...", "pending");

  try {
    const response = await fetch(notesEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data, text }),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const result = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok && !isJson) {
      throw new Error("提交接口还没有部署，暂时无法写入数据库。");
    }

    if (!response.ok || result.ok === false) {
      throw new Error(result.message || "提交失败，请稍后重试。");
    }

    noteText.value = "";
    setNoteStatus(result.message || "已写入数据库。", "success");
  } catch (error) {
    setNoteStatus(
      error.message === "Failed to fetch"
        ? "提交接口还没有部署，暂时无法写入数据库。"
        : error.message,
      "error",
    );
  } finally {
    submitButton.disabled = false;
  }
});

const canvas = document.getElementById("starfield");
const context = canvas.getContext("2d");
let stars = [];
let width = 0;
let height = 0;
let animationFrame;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(150, Math.floor((width * height) / 9000));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.3,
    speed: Math.random() * 0.24 + 0.06,
    alpha: Math.random() * 0.5 + 0.25,
  }));
}

function drawStars() {
  context.clearRect(0, 0, width, height);

  stars.forEach((star) => {
    star.y += star.speed;
    if (star.y > height + 8) {
      star.y = -8;
      star.x = Math.random() * width;
    }

    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(53, 45, 92, ${star.alpha})`;
    context.fill();
  });

  animationFrame = window.requestAnimationFrame(drawStars);
}

resizeCanvas();
drawStars();

window.addEventListener("resize", () => {
  window.cancelAnimationFrame(animationFrame);
  resizeCanvas();
  drawStars();
});
