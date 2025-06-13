const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'gamers.json');

// Читаем данные из файла
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Если файла нет или он пустой, возвращаем пустой массив
    return [];
  }
}

// Записываем данные в файл
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Получить всех игроков
app.get('/players', (req, res) => {
  const players = readData();
  res.json(players);
});

// Добавить или обновить игрока
app.post('/players', (req, res) => {
  const newPlayer = req.body;

  if (!newPlayer.login) {
    return res.status(400).json({ error: 'Missing player login' });
  }

  let players = readData();

  // Ищем игрока по логину
  const index = players.findIndex(p => p.login === newPlayer.login);

  if (index >= 0) {
    // Обновляем данные
    players[index] = newPlayer;
  } else {
    // Добавляем нового игрока
    players.push(newPlayer);
  }

  writeData(players);
  res.json({ message: 'Player saved', player: newPlayer });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
