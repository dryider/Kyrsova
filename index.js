const express = require('express');
const app = express();
const port = 3110;
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('video_cards.db');

db.run('CREATE TABLE IF NOT EXISTS video_cards (name TEXT, memory INTEGER, clockSpeed INTEGER, price INTEGER)');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  db.all('SELECT rowid, * FROM video_cards', (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.render('index', { videoCards: rows });
    }
  });
});

app.get('/add', (req, res) => {
  res.render('add');
});

app.post('/add', (req, res) => {
  const { name, memory, clockSpeed, price } = req.body;

  db.run('INSERT INTO video_cards (name, memory, clockSpeed, price) VALUES (?, ?, ?, ?)', [name, memory, clockSpeed, price], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect('/');
  });
});

app.get('/edit/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT rowid, * FROM video_cards WHERE rowid = ?', [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.render('edit', { videoCard: row });
    }
  });
});

app.post('/edit/:id', (req, res) => {
  const id = req.params.id;
  const { name, memory, clockSpeed, price } = req.body;

  db.run('UPDATE video_cards SET name = ?, memory = ?, clockSpeed = ?, price = ? WHERE rowid = ?', [name, memory, clockSpeed, price, id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect('/');
  });
});

app.get('/delete/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM video_cards WHERE rowid = ?', [id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect('/');
  });
});

app.post('/delete/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM video_cards WHERE rowid = ?', [id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect('/');
  });
});

app.get('/compare', (req, res) => {
  db.all('SELECT rowid, * FROM video_cards', (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.render('compare', { cardsToCompare: rows }); // Update the variable name here
    }
  });
});

app.post('/compareResult', (req, res) => {
    const cardsToCompare = Array.isArray(req.body.cardsToCompare) ? req.body.cardsToCompare : [req.body.cardsToCompare];

    // Получите данные по выбранным видеокартам из базы данных
    const sql = `SELECT * FROM video_cards WHERE rowid IN (${cardsToCompare.map(() => '?').join(',')})`;
    db.all(sql, cardsToCompare, (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        // Инициализируем счетчик лучших параметров
        let bestCount = -1;
        let betterCard = null;

        for (let i = 0; i < rows.length; i++) {
            let count = 0; // Счетчик параметров, которые лучше у текущей видеокарты

            // Сравнение по каждому параметру
            if (rows[i].memory > 8) {
                count++;
            }

            if (rows[i].clockSpeed > 1500) {
                count++;
            }

            if (rows[i].price < 500) {
                count++;
            }

            // Если текущая видеокарта имеет больше лучших параметров, обновляем данные
            if (count > bestCount) {
                bestCount = count;
                betterCard = rows[i];
            }
        }

        res.render('compareResult', { cardsToCompare: rows, betterCard: betterCard });
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
