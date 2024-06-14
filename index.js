const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//user Registration
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectSqlQuery = `
    SELECT * FROM user
    WHERE username = '${username}';
  `
  const dbQuery = await db.get(selectSqlQuery)
  if (dbQuery === undefined) {
    const createUserQuery = `
    INSERT INTO
      user (username, name, password, gender, location)
    VALUES
      (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'  
      );`
    await db.run(createUserQuery)
    response.send('User created Successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//user Login
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectSqlQuery = `
    SELECT * FROM user
    WHERE username = '${username}';
  `
  const dbQuery = await db.get(selectSqlQuery)
  if (dbQuery === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbQuery.password)
    if (isPasswordMatch === true) {
      response.send('Login Successful')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})
