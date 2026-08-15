const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

const SCHEMA = {
  queryType: { name: 'Query' },
  mutationType: { name: 'Mutation' },
  types: [
    {
      kind: 'OBJECT', name: 'Query',
      fields: [
        { name: 'me', args: [], type: { kind: 'OBJECT', name: 'User' }, description: 'Get current authenticated user' },
        { name: 'users', args: [{ name: 'limit', type: { kind: 'SCALAR', name: 'Int' } }], type: { kind: 'LIST', ofType: { name: 'User' } }, description: 'List all users' }
      ]
    },
    {
      kind: 'OBJECT', name: 'Mutation',
      fields: [
        { name: 'updateProfile', args: [{ name: 'input', type: { kind: 'INPUT_OBJECT', name: 'ProfileInput' } }], type: { kind: 'OBJECT', name: 'User' } },
        { name: 'deleteUser', args: [{ name: 'id', type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'Int' } } }], type: { kind: 'OBJECT', name: 'DeleteResult' } },
        { name: 'updateUserRole', args: [{ name: 'id', type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'Int' } } }, { name: 'role', type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'String' } } }], type: { kind: 'OBJECT', name: 'User' } }
      ]
    },
    {
      kind: 'OBJECT', name: 'User',
      fields: [
        { name: 'id', type: { kind: 'SCALAR', name: 'Int' } },
        { name: 'email', type: { kind: 'SCALAR', name: 'String' } },
        { name: 'full_name', type: { kind: 'SCALAR', name: 'String' } },
        { name: 'role', type: { kind: 'SCALAR', name: 'String' } }
      ]
    },
    {
      kind: 'OBJECT', name: 'DeleteResult',
      fields: [
        { name: 'success', type: { kind: 'SCALAR', name: 'Boolean' } },
        { name: 'deletedId', type: { kind: 'SCALAR', name: 'Int' } }
      ]
    }
  ]
};

function executeQuery(query, variables) {
  const db = getDb();

  if (query.includes('__schema') || query.includes('__type')) {
    return { data: { __schema: SCHEMA } };
  }

  if (query.includes('users')) {
    const users = db.prepare('SELECT user_id as id, email, full_name, role FROM users').all();
    return { data: { users } };
  }

  if (query.includes('deleteUser')) {
    const id = variables && variables.id ? variables.id : null;
    if (!id) return { errors: [{ message: 'Variable $id is required' }] };

    // No ownership or role check — any authenticated user can delete any other user
    const result = db.prepare('DELETE FROM users WHERE user_id = ?').run(id);
    return { data: { deleteUser: { success: result.changes > 0, deletedId: id } } };
  }

  if (query.includes('updateUserRole')) {
    const id = variables && variables.id ? variables.id : null;
    const role = variables && variables.role ? variables.role : null;
    if (!id || !role) return { errors: [{ message: 'Variables $id and $role are required' }] };

    db.prepare('UPDATE users SET role = ? WHERE user_id = ?').run(role, id);
    const user = db.prepare('SELECT user_id as id, email, full_name, role FROM users WHERE user_id = ?').get(id);
    return { data: { updateUserRole: user } };
  }

  return { errors: [{ message: 'Unknown operation' }] };
}

router.post('/graphql', (req, res) => {
  const { query, variables } = req.body;
  if (!query) return res.status(400).json({ errors: [{ message: 'Query required' }] });
  res.json(executeQuery(query, variables || {}));
});

module.exports = router;
