// Елементи DOM
const regForm = document.getElementById("registration-form");
const loginForm = document.getElementById("login-form");
const startBtn = document.getElementById("start-game");
const backBtn = document.getElementById("back-to-settings");
const addItemBtn = document.getElementById("add-item-btn");
const choicesDiv = document.getElementById("choices");
const resultDiv = document.getElementById("result");
const scoreboardDiv = document.getElementById("scoreboard");
const welcomeSection = document.getElementById("welcome-section");
const welcomeMessage = document.getElementById("welcome-message");
const registrationSection = document.getElementById("registration-section");
const loginSection = document.getElementById("login-section");
const settingsSection = document.getElementById("settings-section");
const gameSection = document.getElementById("game-section");

let currentUser = null;
let gameHistory = [];
let items = JSON.parse(localStorage.getItem("items") || "[]");

// Початкові предмети, якщо нічого немає
if (items.length === 0) {
  items = [
    { name: "Камінь", beats: ["Ножиці"] },
    { name: "Ножиці", beats: ["Папір"] },
    { name: "Папір", beats: ["Камінь"] }
  ];
  localStorage.setItem("items", JSON.stringify(items));
}

// Хешування пароля (SHA-256)
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Збереження користувачів у JSON і XML
function saveUsers(users) {
  localStorage.setItem("usersJSON", JSON.stringify(users, null, 2));
  const xmlParts = ['<users>'];
  users.forEach(u => {
    xmlParts.push(`
      <user>
        <fullname>${u.fullname}</fullname>
        <birthdate>${u.birthdate}</birthdate>
        <email>${u.email}</email>
        <login>${u.login}</login>
        <passwordHash>${u.passwordHash}</passwordHash>
      </user>
    `);
  });
  xmlParts.push("</users>");
  localStorage.setItem("usersXML", xmlParts.join(""));
}

// Завантаження користувачів
function loadUsers() {
  return JSON.parse(localStorage.getItem("usersJSON") || "[]");
}

// Збереження статистики гри
function saveJSON(data) {
  localStorage.setItem("gameStatsJSON", JSON.stringify(data, null, 2));
}

function saveXML(data) {
  const xml = ['<games>'];
  data.forEach(d => {
    xml.push(`<game><round>${d.round}</round><player>${d.player}</player><bot>${d.bot}</bot><result>${d.result}</result></game>`);
  });
  xml.push('</games>');
  localStorage.setItem("gameStatsXML", xml.join(''));
}

// Відображення статистики (якщо треба — додай кнопки на сторінку та ці обробники)
document.getElementById("show-json-btn")?.addEventListener("click", () => {
  document.getElementById("game-stats-section").classList.remove("hidden");
  statsOutput.textContent = localStorage.getItem("gameStatsJSON") || "Немає статистики";
});
document.getElementById("show-xml-btn")?.addEventListener("click", () => {
  document.getElementById("game-stats-section").classList.remove("hidden");
  statsOutput.textContent = localStorage.getItem("gameStatsXML") || "Немає статистики";
});

// Реєстрація
regForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(regForm);
  const fullname = formData.get("fullname").trim();
  const birthdate = formData.get("birthdate");
  const email = formData.get("email").trim();
  const login = formData.get("login").trim();
  const password = formData.get("password");

  if (!fullname || !birthdate || !email || !login || !password) {
    alert("Заповніть всі поля");
    return;
  }
  addPlayerToStorage(player)

  let users = loadUsers();

  if (users.find(u => u.login === login)) {
    alert("Користувач з таким логіном вже існує");
    return;
  }

  const passwordHash = await hashPassword(password);

  const newUser = { fullname, birthdate, email, login, passwordHash };

  users.push(newUser);
  saveUsers(users);

  alert("Реєстрація успішна! Тепер увійдіть.");

  regForm.reset();
});

// Вхід
loginForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const login = formData.get("login").trim();
  const password = formData.get("password");

  let users = loadUsers();

  const passwordHash = await hashPassword(password);

  const user = users.find(u => u.login === login && u.passwordHash === passwordHash);

  if (!user) {
    alert("Невірний логін або пароль");
    return;
  }

  currentUser = user;

  registrationSection.classList.add("hidden");
  loginSection.classList.add("hidden");
  settingsSection.classList.remove("hidden");
  welcomeSection.classList.remove("hidden");
  welcomeMessage.textContent = `Вітаємо, ${user.fullname}!`;

  updateItemsList();
  updateScoreboardFromHistory();
});

// Кнопка "Назад" в грі до налаштувань
backBtn.addEventListener("click", () => {
  gameSection.classList.add("hidden");
  settingsSection.classList.remove("hidden");
});

// Додавання нового предмета
addItemBtn.addEventListener("click", () => {
  const name = document.getElementById("new-item-name").value.trim();
  const beatsStr = document.getElementById("new-item-beats").value.trim();

  if (!name || !beatsStr) return alert("Заповніть всі поля");

  if (items.find(item => item.name.toLowerCase() === name.toLowerCase()))
    return alert("Такий предмет вже існує");

  const beats = beatsStr.split(",").map(s => s.trim()).filter(Boolean);
  items.push({ name, beats });
  localStorage.setItem("items", JSON.stringify(items));
  updateItemsList();
  document.getElementById("new-item-name").value = "";
  document.getElementById("new-item-beats").value = "";
});

// Оновити список предметів з кнопками видалення
function updateItemsList() {
  const container = document.getElementById("items-section");
  // Очищаємо попередній список, щоб не дублювався
  const oldList = container.querySelector("ul");
  if (oldList) container.removeChild(oldList);

  const list = document.createElement("ul");
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (перемагає: ${item.beats.join(", ")}) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.onclick = () => {
      if (confirm(`Видалити "${item.name}"?`)) {
        items.splice(i, 1);
        localStorage.setItem("items", JSON.stringify(items));
        updateItemsList();
      }
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
  container.appendChild(list);
}

// Почати гру
startBtn.addEventListener("click", () => {
  settingsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  renderChoices();
  resultDiv.textContent = "";
  scoreboardDiv.textContent = "";
  gameHistory = [];
});

// Відображення кнопок вибору предметів
function renderChoices() {
  choicesDiv.innerHTML = "";
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.textContent = item.name;
    btn.onclick = () => playRound(item.name);
    choicesDiv.appendChild(btn);
  });
}

// Грати раунд
function playRound(playerChoice) {
  const botChoice = getBotChoice();
  const outcome = getRoundResult(playerChoice, botChoice);

  resultDiv.textContent = `Ви: ${playerChoice} | Бот: ${botChoice} → ${outcome}`;
  gameHistory.push({
    round: gameHistory.length + 1,
    player: playerChoice,
    bot: botChoice,
    result: outcome
  });

  saveJSON(gameHistory);
  saveXML(gameHistory);
  updateScoreboard();
}

// Вибір бота (проста випадкова логіка)
function getBotChoice() {
  const randIndex = Math.floor(Math.random() * items.length);
  return items[randIndex].name;
}

// Визначення результату раунду
function getRoundResult(player, bot) {
  if (player === bot) return "Нічия";

  const playerItem = items.find(item => item.name === player);
  if (playerItem.beats.includes(bot)) return "Ви перемогли!";
  return "Ви програли!";
}

// Оновлення табло
function updateScoreboard() {
  const wins = gameHistory.filter(r => r.result === "Ви перемогли!").length;
  const losses = gameHistory.filter(r => r.result === "Ви програли!").length;
  const draws = gameHistory.filter(r => r.result === "Нічия").length;

  scoreboardDiv.innerHTML = `
    <p>Перемоги: ${wins}</p>
    <p>Поразки: ${losses}</p>
    <p>Нічиї: ${draws}</p>
  `;
}

// Оновлення табло за збереженою історією гри (при вході)
function updateScoreboardFromHistory() {
  const savedHistory = JSON.parse(localStorage.getItem("gameStatsJSON") || "[]");
  if (savedHistory.length) {
    gameHistory = savedHistory;
    updateScoreboard();
  }
}
function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Скачування користувачів JSON
document.getElementById("download-users-json").addEventListener("click", () => {
  const usersJSON = localStorage.getItem("usersJSON");
  if (!usersJSON) return alert("Немає даних користувачів");
  downloadFile("users.json", usersJSON, "application/json");
});

// Скачування користувачів XML
document.getElementById("download-users-xml").addEventListener("click", () => {
  const usersXML = localStorage.getItem("usersXML");
  if (!usersXML) return alert("Немає даних користувачів");
  downloadFile("users.xml", usersXML, "application/xml");
});

// Скачування статистики гри JSON
document.getElementById("download-game-json").addEventListener("click", () => {
  const gameJSON = localStorage.getItem("gameStatsJSON");
  if (!gameJSON) return alert("Немає статистики гри");
  downloadFile("game_stats.json", gameJSON, "application/json");
});

// Скачування статистики гри XML
document.getElementById("download-game-xml").addEventListener("click", () => {
  const gameXML = localStorage.getItem("gameStatsXML");
  if (!gameXML) return alert("Немає статистики гри");
  downloadFile("game_stats.xml", gameXML, "application/xml");
});
function addPlayerToStorage(newPlayer) {
  let players = JSON.parse(localStorage.getItem("players")) || [];

  // Проверим, есть ли уже игрок с таким fullname или логином
  const existingIndex = players.findIndex(p => p.login === newPlayer.login);

  if (existingIndex !== -1) {
    // Если игрок уже есть — обновим его данные (например, email, fullname)
    players[existingIndex] = {...players[existingIndex], ...newPlayer};
  } else {
    // Добавим нового игрока
    players.push(newPlayer);
  }

  localStorage.setItem("players", JSON.stringify(players));
}
// Прості функції для роботи з localStorage
function loadPlayers() {
  return JSON.parse(localStorage.getItem("players") || "[]");
}
function savePlayers(players) {
  localStorage.setItem("players", JSON.stringify(players));
}

// Добавляємо нового гравця або оновлюємо, якщо логін вже є
function addOrUpdatePlayer(player) {
  let players = loadPlayers();
  const index = players.findIndex(p => p.login === player.login);
  if (index !== -1) {
    players[index] = {...players[index], ...player};
  } else {
    players.push(player);
  }
  savePlayers(players);
}

// Розділяємо ПІБ на Прізвище та Ім'я
function splitFullName(fullname) {
  const parts = fullname.trim().split(/\s+/);
  return {
    surname: parts[0] || "",
    name: parts.slice(1).join(" ") || ""
  };
}

// Відображення таблиці статистики, сортуємо по Прізвищу (alphabetically)
function renderStatsTable() {
  const players = loadPlayers();
  players.sort((a,b) => {
    const aSurname = splitFullName(a.fullname).surname.toLowerCase();
    const bSurname = splitFullName(b.fullname).surname.toLowerCase();
    if (aSurname < bSurname) return -1;
    if (aSurname > bSurname) return 1;
    return 0;
  });

  const tbody = document.querySelector("#players-table tbody");
  tbody.innerHTML = "";

  for (const p of players) {
    const {surname, name} = splitFullName(p.fullname);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${surname}</td>
      <td>${name}</td>
      <td>${p.birthdate}</td>
      <td>${p.wins || 0}</td>
      <td>${p.draws || 0}</td>
      <td>${p.losses || 0}</td>
      <td>${p.botLevel || "-"}</td>
    `;
    tbody.appendChild(tr);
  }
}

// Приховуємо/показуємо секції
function showSection(idToShow) {
  ["registration-section", "login-section", "stats-section"].forEach(id => {
    document.getElementById(id).classList.toggle("hidden", id !== idToShow);
  });
}

// Початкова логіка
document.addEventListener("DOMContentLoaded", () => {
  showSection("registration-section");

  const regForm = document.getElementById("registration-form");
  const loginForm = document.getElementById("login-form");

  // Обробник реєстрації
  regForm.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(regForm);
    const fullname = formData.get("fullname").trim();
    const birthdate = formData.get("birthdate");
    const email = formData.get("email");
    const login = formData.get("login").trim();
    const password = formData.get("password"); // Не зберігаємо пароль відкрито!

    // Перевірка унікальності логіна
    const players = loadPlayers();
    if (players.find(p => p.login === login)) {
      alert("Користувач із таким логіном вже існує.");
      return;
    }

    // Створюємо гравця з початковою статистикою
    const newPlayer = {
      fullname,
      birthdate,
      email,
      login,
      wins: 0,
      draws: 0,
      losses: 0,
      botLevel: "-"
    };

    addOrUpdatePlayer(newPlayer);

    alert("Реєстрація пройшла успішно! Тепер увійдіть.");

    regForm.reset();
    showSection("login-section");
  });

  // Обробник входу
  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const login = formData.get("login").trim();
    const password = formData.get("password");

    const player = loadPlayers().find(p => p.login === login);

    if (!player) {
      alert("Користувача не знайдено.");
      return;
    }
    // Тут можна додати перевірку пароля, якщо будеш зберігати його (краще на сервері)

    alert(`Вхід успішний! Ласкаво просимо, ${player.fullname}`);

    // Показуємо статистику (зараз просто)
    showSection("stats-section");
    renderStatsTable();
  });
});
function renderStatsTable() {
  const players = JSON.parse(localStorage.getItem("players") || "[]");

  // Сортировка по фамилии (первая часть fullname)
  players.sort((a,b) => {
    const aSurname = (a.fullname || "").split(" ")[0].toLowerCase();
    const bSurname = (b.fullname || "").split(" ")[0].toLowerCase();
    return aSurname.localeCompare(bSurname);
  });

  const tbody = document.querySelector("#players-table tbody");
  tbody.innerHTML = ""; // очищаем перед вставкой

  for (const p of players) {
    const [surname, ...nameParts] = (p.fullname || "").split(" ");
    const name = nameParts.join(" ");
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${surname || ""}</td>
      <td>${name || ""}</td>
      <td>${p.birthdate || ""}</td>
      <td>${p.wins || 0}</td>
      <td>${p.draws || 0}</td>
      <td>${p.losses || 0}</td>
      <td>${p.botLevel || "-"}</td>
    `;

    tbody.appendChild(tr);
  }

  // Показываем таблицу, если она была скрыта
  document.getElementById("stats-section").classList.remove("hidden");
}
document.addEventListener("DOMContentLoaded", () => {
  renderStatsTable();
});
