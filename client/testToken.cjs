const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 'test@example.com', studentId: 1 }, 'MySecretKeyForJWTTokenGenerationMessReductionApp2024', { expiresIn: '1h' });

const axios = require('axios');
axios.get('http://localhost:8080/api/student-form/Student/1', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => console.log("Student details:", res.data))
    .catch(err => console.log("Error:", err.response ? err.response.data : err.message));
