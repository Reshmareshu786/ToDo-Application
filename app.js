const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const pathDir = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: pathDir,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running on http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Db error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertToResponseObject = async dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  }
}

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriority(request.query):
      getTodosQuery = `SELECT * FROM todo
     WHERE todo LIKE '%${search_q}%'
     AND priority = '${priority}';`
      break
    case hasStatus(request.query):
      getTodosQuery = `SELECT * FROM todo
      WHERE todo LIKE '%${search_q}'
      AND status = '${status}';`
      break
    default:
      getTodosQuery = `SELECT * FROM todo
       WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `SELECT * FROM todo
  WHERE id = ${todoId};`
  const dbTodo = await db.get(getTodosQuery)
  response.send(dbTodo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const insertTodoQuery = `INSERT INTO todo
  (id,todo,priority,status) VALUES 
  (${id},'${todo}','${priority}','${status}');`
  await db.run(insertTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let update = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.todo !== undefined:
      update = 'Todo'
      break
    case requestBody.priority !== undefined:
      update = 'Priority'
      break
    case requestBody.status !== undefined:
      update = 'Status'
      break
  }
  const previousTodoQuery = `SELECT * FROM todo
   WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `UPDATE todo SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = ${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${update} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo
   WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
