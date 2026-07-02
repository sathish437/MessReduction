const axios = require('axios');

async function testFlow() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:8083/api/auth/login', {
      emailId: 'sathishpotta@gmail.com',
      dob: '2005-10-15'
    });
    const token = loginRes.data.token;
    const studentId = loginRes.data.studentId;
    
    // 2. Fetch forms to get the form ID
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const formsRes = await axios.get(`http://localhost:8083/api/student-form/Student/${studentId}`, config);
    const forms = Array.isArray(formsRes.data) ? formsRes.data : formsRes.data.reductionForms || [];
    console.log('Forms fetched:', forms.map(f => f.formId));
    let formToSubmit = forms.find(f => f.formId === 48);
    
    // 3. Login as deputyWarden3 to reject the form if it's pending
    if (formToSubmit && formToSubmit.currentStatus === 'PendingDeputyWarden') {
        console.log('Logging in as deputyWarden3 to reject form', formToSubmit.formId);
        const deputyLoginRes = await axios.post('http://localhost:8083/api/staff/login', {
            userName: 'deputyWarden3',
            password: 'deputy123',
            role: 'DeputyWarden'
        });
        const deputyToken = deputyLoginRes.data.token;
        const deputyConfig = { headers: { Authorization: `Bearer ${deputyToken}` } };
        
        await axios.patch(`http://localhost:8083/api/hostelStaff/staff/deputyWarden/${formToSubmit.formId}/reject`, 
            { rejectReason: 'Test Rejection' }, deputyConfig);
        console.log('Rejected successfully by deputyWarden3');
    }
    
    if (formToSubmit) {
      console.log('Resubmitting form:', formToSubmit.formId);
      const resubmitPayload = {
        year: 3,
        roomNo: 1234,
        leaveDate: "2026-07-02",
        leaveTime: "10:26:00",
        arrivalDate: "2026-07-09",
        arrivalTime: "10:26:00",
        reason: "Study Holidays"
      };
      const submitRes = await axios.post(`http://localhost:8083/api/student-form/StudentForm/${studentId}/${formToSubmit.formId}/resubmit`, resubmitPayload, config);
      console.log('Submit Success:', submitRes.data);
    }
    
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testFlow();
