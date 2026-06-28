const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      emailId: 'test@example.com',
      dob: '2000-01-01'
    });
    console.log("Login res:", loginRes.data);
    
    const token = loginRes.data.token;
    const studentId = loginRes.data.studentId;
    
    const detailsRes = await axios.get(`http://localhost:8080/api/student-form/Student/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Student Details:", JSON.stringify(detailsRes.data, null, 2));
  } catch (e) {
    if (e.response && e.response.status === 401) {
        // try to find a user in DB
        console.log("Need a valid user to test");
    } else {
        console.error(e.message, e.response?.data);
    }
  }
}
test();
